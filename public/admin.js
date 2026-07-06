const API_BASE = ""; // same domain

/* ================= ADMIN PAGE PROTECTION ================= */
if (localStorage.getItem("adminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}

function logout() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "admin-login.html";
}

/* ================= SECTION SWITCH ================= */
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const active = document.getElementById(id);
  if (active) active.style.display = 'block';
}

/* ================= ADD PRODUCT ================= */
const addProductForm = document.getElementById('addProductForm');

if (addProductForm) {
  addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const price = document.getElementById('productPrice').value;
    const image = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDesc').value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, image, description })
      });

      if (res.ok) {
        alert('Product added');
        loadProducts();
        e.target.reset();
      } else {
        alert('Failed to add product');
      }

    } catch (err) {
      console.error("Add product error:", err);
      alert("Server error while adding product");
    }
  });
}

/* ================= LOAD PRODUCTS ================= */
async function loadProducts() {
  const table = document.querySelector('#products .admin-table');
  if (!table) return;

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();

    table.innerHTML = `
      <div class="table-row header">
        <span>Name</span>
        <span>Price</span>
        <span>Action</span>
      </div>
    `;

    products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'table-row';
      row.innerHTML = `
        <span>${p.name}</span>
        <span>₹${p.price}</span>
        <span>
          <button class="delete" onclick="deleteProduct('${p._id}')">Delete</button>
        </span>
      `;
      table.appendChild(row);
    });

  } catch (err) {
    console.error("Load products error:", err);
  }
}

/* ================= DELETE PRODUCT ================= */
async function deleteProduct(id) {
  try {
    await fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: 'DELETE'
    });
    loadProducts();
  } catch (err) {
    console.error("Delete error:", err);
  }
}

/* ================= LOAD ORDERS ================= */
async function loadOrders() {
  const table = document.querySelector('#orders .admin-table');
  if (!table) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/orders`, {
  credentials: 'include'
})
    const orders = await res.json();
if (!Array.isArray(orders)) {
  console.error("Not authorized or error:", orders);
  table.innerHTML = "<p>Unauthorized or no data</p>";
  return;
}
document.getElementById("totalOrders").innerText = orders.length;

document.getElementById("pendingOrders").innerText =
  orders.filter(o => o.status === "Order Placed").length;

document.getElementById("shippedOrders").innerText =
  orders.filter(o => o.status === "Shipped").length;

document.getElementById("deliveredOrders").innerText =
  orders.filter(o => o.status === "Delivered").length;

   table.innerHTML = `
  <div class="table-header">
    <div>Order ID</div>
    <div>User</div>
    <div>Address</div>
    <div>Pages</div>
    <div>Type</div>
    <div>Total</div>
    <div>File</div>
    <div>Status</div>
    <div>Action</div>
  </div>
`;

    orders.forEach(o => {
      const row = document.createElement('div');
      row.className = 'table-row';

    row.innerHTML = `
  <div>${o._id}</div>
  <div>${o.userId?.username || 'N/A'}</div>
  <div>${o.userId?.address || 'N/A'}</div>
  <div>${o.pageCount && o.pageCount > 0 ? o.pageCount : '-'}</div>
  <div>${o.size && o.size !== 'A4' ? o.size : '-'}</div>
  <div>₹${o.totalAmount || 0}</div>
  <div>
    ${
      o.uploadedFile
        ? `<a href="/uploads/${o.uploadedFile}" target="_blank">View</a>`
        : '—'
    }
  </div>
  <div class="status ${o.status.replace(/\s/g, '')}">
    ${o.status}
  </div>
  <div>
    <select onchange="updateOrder('${o._id}', this.value)">
      <option ${o.status === 'Order Placed' ? 'selected' : ''}>Order Placed</option>
      <option ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
      <option ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
    </select>
  </div>
`;
      table.appendChild(row);
    });

  } catch (err) {
    console.error("Load orders error:", err);
  }
}

/* ================= UPDATE ORDER ================= */
async function updateOrder(id, status) {
  try {
    await fetch(`${API_BASE}/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    alert("Order updated");
    loadOrders();

  } catch (err) {
    console.error("Update order error:", err);
  }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadOrders();
});