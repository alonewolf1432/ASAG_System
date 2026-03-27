from fastapi import FastAPI
from pydantic import BaseModel
from asag_model import process_files

app = FastAPI()

class InputData(BaseModel):
    questions_url: str
    reference_url: str
    students_url: str

@app.get("/")
def home():
    return {"message": "ASAG Model API is running"}

@app.post("/grade")
def grade(data: InputData):
    try:
        result = process_files(
            data.questions_url,
            data.reference_url,
            data.students_url
        )

        # ✅ ENSURE STRUCTURE
        return {
            "results": result.get("results", []),
            "summary": result.get("summary", {}),
            "csv_base64": result.get("csv_base64", "")
        }

    except Exception as e:
        return {
            "results": [],
            "summary": {},
            "csv_base64": "",
            "error": str(e)
        }