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

    // ✅ STORE TOKEN (ONLY ONCE)
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      console.log("TOKEN SAVED:", data.token); // 🔥 DEBUG

      alert('Login successful!');
      window.location.href = "upload.html";
    } else {
      alert("Login failed: No token received");
    }

  } catch (err) {
    alert(err.message);
  }
});


document.querySelector('.user-guide-btn').addEventListener('click', function (e) {
    e.preventDefault();

    const link = document.createElement('a');
    link.href = "https://res.cloudinary.com/your-cloud-name/image/upload/fl_attachment/v123456/user_guide.pdf";
    link.download = "ASAG_User_Guide.pdf";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});


//python -m http.server 3000