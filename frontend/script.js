// frontend/script.js
const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

// animation toggles (don’t change)
registerLink.addEventListener('click', () => wrapper.classList.add('active'));
loginLink.addEventListener('click', () => wrapper.classList.remove('active'));
btnPopup.addEventListener('click', () => wrapper.classList.add('active-popup'));
iconClose.addEventListener('click', () => wrapper.classList.remove('active-popup'));

// forms
const loginForm = document.querySelector('.form-box.login form');
const registerForm = document.querySelector('.form-box.register form');

const API_BASE = 'https://asag-backend.onrender.com/api'; // backend base URL

// helper for alerts
function showAlert(msg) {
  alert(msg);
}

// ✅ REGISTER HANDLER
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = registerForm.querySelector('input[type="text"]').value.trim();
  const email = registerForm.querySelector('input[type="email"]').value.trim();
  const password = registerForm.querySelector('input[type="password"]').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // ✅ Don’t auto-login; just notify user
    alert('Registered successfully! Please login now.');

    // ✅ Switch to login form automatically
    wrapper.classList.remove('active'); // shows login form again

  } catch (err) {
    showAlert(err.message);
  }
});

// ✅ LOGIN HANDLER
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = loginForm.querySelector('input[type="email"]').value.trim();
  const password = loginForm.querySelector('input[type="password"]').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    // ✅ save token & redirect to upload.html
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    alert('Login successful!');
    window.location.href = 'upload.html';

  } catch (err) {
    showAlert(err.message);
  }
});


const storedData = JSON.parse(localStorage.getItem("gradedData"));

if (!storedData) {
    alert("No data found. Please upload again.");
    window.location.href = "upload.html";
}

// ✅ USE DIRECT DATA
const results = storedData.results;
const summary = storedData.summary;

// Save globally for download
globalGradedData = results;

// Render
processStats(results);
renderTable(results);
//python -m http.server 3000