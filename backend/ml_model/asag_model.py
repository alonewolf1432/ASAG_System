import os
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

import pandas as pd
import requests
from io import BytesIO
import base64

from sentence_transformers import SentenceTransformer, util
from keybert import KeyBERT
from thefuzz import fuzz
import numpy as np

# -----------------------------
# LOAD FILE FROM URL
# -----------------------------
def load_file(url):
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch file: {url}")

    if url.endswith('.xlsx'):
        return pd.read_excel(BytesIO(response.content))
    elif url.endswith('.csv'):
        return pd.read_csv(BytesIO(response.content))
    else:
        raise Exception("Unsupported file format")


# -----------------------------
# PREPROCESS (UNCHANGED)
# -----------------------------
def preprocess_and_merge(q_url, r_url, s_url):

    df_q = load_file(q_url)
    df_ref = load_file(r_url)
    df_std = load_file(s_url)

    questions_list = df_q.iloc[:, 0].astype(str).str.strip().tolist()
    references_list = df_ref.iloc[:, 0].astype(str).str.strip().tolist()

    ref_lookup = dict(zip(questions_list, references_list))

    possible_id_cols = ['Name', 'Student Name', 'Email', 'Email Address', 'Roll Number', 'Student ID']
    id_col = next((col for col in df_std.columns if col in possible_id_cols), None)

    if not id_col:
        first_col = df_std.columns[0]
        if 'timestamp' not in first_col.lower():
            id_col = first_col
        elif len(df_std.columns) > 1:
            id_col = df_std.columns[1]

    processed_rows = []

    for index, row in df_std.iterrows():
        student_id = str(row[id_col]) if id_col else f"Student_{index+1}"

        for col in df_std.columns:
            clean_col = str(col).strip()

            if 'timestamp' in clean_col.lower():
                continue

            if clean_col in ref_lookup:
                processed_rows.append({
                    'Student ID': student_id,
                    'Question': clean_col,
                    'Student Answer': str(row[col]),
                    'Reference Answer': ref_lookup[clean_col]
                })

    return pd.DataFrame(processed_rows)


# -----------------------------
# MAIN FUNCTION
# -----------------------------
def process_files(q_url, ref_url, std_url):

    df = preprocess_and_merge(q_url, ref_url, std_url)

    if df is None or df.empty:
        return {"error": "Dataset empty"}

    sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
    kw_model = KeyBERT(model=sbert_model)

    # ORIGINAL FUNCTIONS
    def clean_text(text):
        return str(text).lower().strip()

    def is_empty_answer(text):
        cleaned = text.strip()
        return len(cleaned) == 0 or cleaned.lower() in ['na', 'n/a', 'none', '-']

    def assign_grade(score):
        if score >= 0.80: return 5
        elif score >= 0.70: return 4
        elif score >= 0.60: return 3
        elif score >= 0.45: return 2
        elif score >= 0.35: return 1
        else: return 0

    def normalize_by_length(score, student_ans, ref_ans):
        len_ratio = len(student_ans.split()) / max(len(ref_ans.split()), 1)
        if len_ratio < 0.2:
            return score * 0.6
        elif len_ratio < 0.3:
            return score * 0.8
        elif len_ratio < 0.5:
            return score * 0.9
        return score

    def check_negation_mismatch(student_ans, ref_ans):
        NEGATIONS = ["not", "never", "no", "doesn't", "don't", "cannot", "can't",
                     "without", "lack", "absence", "fails to", "unable"]

        student_padded = f" {student_ans.lower()} "
        ref_padded = f" {ref_ans.lower()} "

        student_has = any(f" {n} " in student_padded for n in NEGATIONS)
        ref_has = any(f" {n} " in ref_padded for n in NEGATIONS)

        return 0.75 if student_has != ref_has else 1.0

    def generate_natural_feedback(grade, missed_keywords, is_short=False, has_negation_issue=False):
        if grade == 5:
            return "Excellent work! Your answer is comprehensive and accurate."
        
        elif grade == 4:
            if has_negation_issue:
                return "Good overall, but please verify your understanding - there may be a contradiction in your answer."
            elif is_short:
                return "Good answer, but consider providing more detail to fully demonstrate your understanding."
            elif not missed_keywords:
                return "Very good answer. You captured the main points well."
            else:
                return f"Good answer, but you missed a few key details like: {', '.join(missed_keywords[:2])}."
        
        elif grade == 3:
            if has_negation_issue:
                return "You seem to have the basic idea, but there's a contradiction in your answer. Please review the concepts."
            elif is_short:
                return f"You're on the right track, but your answer is too brief. Expand on concepts like: {', '.join(missed_keywords[:3])}."
            elif missed_keywords:
                return f"You have a general understanding, but missed important concepts: {', '.join(missed_keywords[:3])}."
            else:
                return "Average response. Try to be more specific and detailed next time."
        
        elif grade == 2:
            if has_negation_issue:
                return "Your answer contains contradictions. Please carefully review the core concepts."
            elif is_short:
                return "Your answer is too brief and lacks important details. Please provide a more thorough explanation."
            else:
                return f"Your answer is partially correct but lacks depth. Please review: {', '.join(missed_keywords[:3])}."
        
        elif grade == 1:
            return "Your answer is not clear or detailed enough. Please revisit the core concepts."
        
        else:
            return "The answer is incorrect, incomplete, or irrelevant to the question."

    results_list = []

    unique_questions = df['Question'].unique()

    for question in unique_questions:

        df_q = df[df['Question'] == question].copy()

        ref = df_q['Reference Answer'].iloc[0]
        ref_clean = clean_text(ref)

        ref_word_count = len(ref.split())
        if not ref or str(ref).strip() == "":
            continue
        top_n = min(8, max(3, ref_word_count // 12)) if ref_word_count >= 15 else 2

        keywords_data = kw_model.extract_keywords(
            ref,
            keyphrase_ngram_range=(1, 3),
            stop_words='english',
            use_mmr=True,
            diversity=0.7,
            top_n=top_n
        )

        keywords = [kw[0] for kw in keywords_data]
        df_q['Extracted_Keywords'] = [", ".join(keywords) for _ in range(len(df_q))]

        kw_embeddings = sbert_model.encode(keywords, convert_to_tensor=True) if keywords else None
        ref_embedding = sbert_model.encode(ref_clean, convert_to_tensor=True)

        df_q['Cleaned'] = df_q['Student Answer'].apply(clean_text)
        student_list = df_q['Cleaned'].tolist()
        student_embeddings = sbert_model.encode(student_list, convert_to_tensor=True)

        global_scores = util.pytorch_cos_sim(student_embeddings, ref_embedding).cpu().numpy().flatten()

        final_scores = []
        grades = []
        feedbacks = []
        missed_all = []

        for i, student_ans in enumerate(student_list):

            if is_empty_answer(student_ans):
                final_scores.append(0)
                grades.append(0)
                feedbacks.append("No answer provided.")
                missed_all.append([])
                continue

            g_score = global_scores[i]
            hits = 0
            missed_keywords = []

            if keywords and kw_embeddings is not None:
                try:
                    student_emb = sbert_model.encode(student_ans, convert_to_tensor=True)
                    similarities = util.pytorch_cos_sim(kw_embeddings, student_emb).cpu().numpy().flatten()

                    KEYWORD_THRESHOLD = 0.65

                    for idx, kw in enumerate(keywords):
                        if similarities[idx] >= KEYWORD_THRESHOLD:
                            hits += 1
                        else:
                            missed_keywords.append(kw)

                    l_score = hits / len(keywords)

                except Exception as e:
                    # 🔥 FALLBACK TO FUZZY MATCHING
                    for kw in keywords:
                        if fuzz.partial_token_set_ratio(kw, student_ans) >= 80:
                            hits += 1
                        else:
                            missed_keywords.append(kw)

                    l_score = hits / len(keywords) if len(keywords) > 0 else 0
            else:
                l_score = 0
                missed_keywords = []

            hybrid = (g_score * 0.65) + (l_score * 0.35)
            final_score = max(g_score, hybrid)

            before = final_score
            final_score = normalize_by_length(final_score, student_ans, ref_clean)
            is_short = final_score < before

            neg_penalty = check_negation_mismatch(student_ans, ref_clean)
            has_negation_issue = (neg_penalty != 1.0)
            final_score *= neg_penalty

            grade = assign_grade(final_score)
            feedback = generate_natural_feedback(grade, missed_keywords, is_short, has_negation_issue)

            final_scores.append(final_score)
            grades.append(grade)
            feedbacks.append(feedback)
            missed_all.append(missed_keywords)

        df_q['Score'] = final_scores
        df_q['Grade'] = grades
        df_q['Feedback'] = feedbacks
        df_q['Missed Keywords'] = missed_all

        results_list.append(df_q)

    final_df = pd.concat(results_list, ignore_index=True)

    # -----------------------------
    # 📊 SUMMARY STATS (RESTORED)
    # -----------------------------
    grade_distribution = final_df['Grade'].value_counts().to_dict()
    average_score = float(final_df['Score'].mean())
    average_grade = float(final_df['Grade'].mean())

    # OUTPUT
    csv_bytes = final_df.to_csv(index=False).encode()
    csv_base64 = base64.b64encode(csv_bytes).decode()

    json_result = final_df.to_dict(orient="records")

    return {
    "results": json_result,
    "csv_base64": csv_base64,
    "summary": {
        "average_score": average_score,
        "average_grade": average_grade,
        "grade_distribution": grade_distribution
        }
    }