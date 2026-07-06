document.getElementById("adminLoginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = adminUsername.value;
  const password = adminPassword.value;
  const msg = document.getElementById("loginMsg");

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', 
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      // ✅ frontend flag
      localStorage.setItem("adminLoggedIn", "true");

      msg.style.color = "green";
      msg.innerText = "Login successful ✔️";

      setTimeout(() => {
        window.location.href = "admin.html";
      }, 800);

    } else {
      msg.style.color = "red";
      msg.innerText = data.message || "Login failed ❌";
    }

  } catch (err) {
    console.error(err);
    msg.innerText = "Server error ❌";
  }
});