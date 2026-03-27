const axios = require('axios');
const cloudinary = require('../config/cloudinary');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const auth = require('../middleware/authMiddleware');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'others';

    if (file.fieldname === 'questionsFile') subfolder = 'questions';
    else if (file.fieldname === 'referenceFile') subfolder = 'reference';
    else if (file.fieldname === 'studentFile') subfolder = 'students';

    const dir = path.join(__dirname, '..', 'uploads', subfolder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
    }
  });

  const upload = multer({ storage });

  const uploadFields = upload.fields([
    { name: 'questionsFile', maxCount: 1 },
    { name: 'referenceFile', maxCount: 1 },
    { name: 'studentFile', maxCount: 1 }
  ]);

async function saveFileRecord(userId, category, filename, filepath) {
  try {
    await db.query(
      'INSERT INTO files (user_id, category, filename, filepath) VALUES ($1, $2, $3, $4)',
      [userId, category, filename, filepath]
    );
  } catch (err) {
    console.error("DB Save Error:", err);
  }
}

router.post('/grade-all', auth, uploadFields, async (req, res) => {
  let qFile, rFile, sFile;

  try {
    const files = req.files;

    if (!files || !files.questionsFile || !files.referenceFile || !files.studentFile) {
      return res.status(400).json({ error: 'Missing required files' });
    }

    qFile = files.questionsFile[0];
    rFile = files.referenceFile[0];
    sFile = files.studentFile[0];

    await saveFileRecord(req.user.id, 'questions', qFile.originalname, qFile.path);
    await saveFileRecord(req.user.id, 'reference', rFile.originalname, rFile.path);
    await saveFileRecord(req.user.id, 'students', sFile.originalname, sFile.path);

    console.log("Uploading to Cloudinary...");

    const uploadFile = (filePath, folder) => {
      return cloudinary.uploader.upload(filePath, {
        resource_type: 'raw',
        folder
      });
    };

    const [qUpload, rUpload, sUpload] = await Promise.all([
      uploadFile(qFile.path, 'questions'),
      uploadFile(rFile.path, 'reference'),
      uploadFile(sFile.path, 'students')
    ]);

    console.log("Cloudinary upload done");

    console.log("Process completed successfully");
    const hfResponse = await axios.post(
      "https://alonewolf143-asag-grader.hf.space/grade",
      {
        questions_url: qUpload.secure_url,
        reference_url: rUpload.secure_url,
        students_url: sUpload.secure_url
      },
      { timeout: 300000 }
    );

    const result = hfResponse.data;
    console.log("HF RESPONSE:", hfResponse.data);
    if (!result || !result.results) {
      throw new Error("Invalid response from ML API");
    }

    if (!result.csv_base64) {
      throw new Error("CSV data missing from ML response");
    }
    const csvUpload = await cloudinary.uploader.upload(
      `data:text/csv;base64,${result.csv_base64}`,
      {
        resource_type: 'raw',
        folder: 'results'
      }
    );

    res.json({
      message: "Grading completed",
      dashboardData: result.results,
      summary: result.summary,
      csvUrl: csvUpload.secure_url
    });

  } catch (err) {
    console.error("ERROR:", {
      message: err.message,
      response: err.response?.data
    });

    res.status(500).json({
      error: "Processing failed",
      details: err.response?.data || err.message
    });

  } finally {
    // ✅ SAFE CLEANUP
    [qFile?.path, rFile?.path, sFile?.path].forEach(file => {
      try {
        if (file && fs.existsSync(file)) fs.unlinkSync(file);
      } catch {
        console.warn("Cleanup failed:", file);
      }
    });
  }
});

module.exports = router;