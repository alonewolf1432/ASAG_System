# 📁 File Upload Authentication System

A full-stack web application that allows users to register, log in, and securely upload files using **Node.js**, **Express**, **PostgreSQL**, and important backend libraries like **bcrypt**, **jsonwebtoken**, and **multer** for secure file handling and authentication.

---

## 🚀 Features

- User Registration  
- User Login with JWT-based authentication  
- Secure password hashing using bcrypt  
- Upload **Reference Answers**, **Student Answers**, and **Questions**  
- Protected routes with JWT  
- Frontend popup animations for Login & Registration  
- Modern UI with HTML, CSS, and JavaScript  
- PostgreSQL database integration  
- Multer for file uploads  
- Fully structured frontend + backend separation  

---

## 🛠️ Tech Stack

### **Frontend**
- HTML  
- CSS  
- JavaScript  

### **Backend**
- Node.js  
- Express.js  

### **Database**
- PostgreSQL  

### **Libraries Used**
- bcryptjs (Password hashing)  
- jsonwebtoken (JWT Authentication)  
- pg (PostgreSQL client)  
- multer (File uploads)  
- cors (Cross-origin resource sharing)  
- dotenv (Environment variable management)

---

## 📂 Project Structure

final_year_project/
│
├── backend/
│ ├── server.js
│ ├── routes/
│ ├── controllers/
│ ├── uploads/
│ ├── package.json
│ └── .env (NOT INCLUDED in GitHub)
│
├── frontend/
│ ├── index.html
│ ├── upload.html
│ ├── styles.css
│ ├── styles1.css
│ ├── script.js
│ └── background.jpg
│
└── README.md

yaml
Copy code

---

## ⚙️ Setup Instructions

### 🔧 1️⃣ Clone the Repository

```bash
git clone https://github.com/alonewolf1432/File-Upload-Authentication-System.git
cd File-Upload-Authentication-System
🔌 2️⃣ Backend Setup
bash
Copy code
cd backend
npm install
➤ Create a .env file inside backend/
⚠️ Do NOT use my credentials — add your own PostgreSQL username, password, and database.

Example:

ini
Copy code
PORT=5000
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=mydb
PGPORT=5432
JWT_SECRET=your_jwt_secret
➤ Start the backend server
bash
Copy code
node server.js
Backend will run on:
👉 http://localhost:5000

🖥️ 3️⃣ Frontend Setup
You can use Live Server or a simple Python server.

Using Live Server (VS Code extension)
Right-click index.html → Open with Live Server

OR using Python
bash
Copy code
cd frontend
python -m http.server 3000
Frontend runs on:
👉 http://localhost:3000

🔒 4️⃣ Environment Variables
Your .env must contain your own:

PostgreSQL credentials

JWT secret

Port number

These values must never be uploaded to GitHub.
The .gitignore file already prevents .env from being uploaded.

🛠️ Future Enhancements
Add Email OTP Verification

Add File Preview before upload

Add User Roles (Admin, Teacher, Student, etc.)

Add Progress Bars for file uploads

Improve UI with React.js

Deploy Application to Cloud (Render, Railway, Netlify, etc.)

📜 License
This project is protected under the MIT License, meaning:

✔ Free to use
✔ Free to modify
✔ Free to distribute
✔ Requires giving credit to the original author

👨‍💻 Author
alonewolf
GitHub: https://github.com/alonewolf1432
Email: sathwikkilari6@gmail.com

⭐ Show Your Support
If you found this helpful, give the project a ⭐ on GitHub!

---
