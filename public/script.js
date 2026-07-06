// ================= AUTH CHECK & LOGOUT =================
async function checkAuth() {
  try {
    const res = await fetch('/api/check-auth', { credentials: 'include' });
    const data = await res.json();

    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const addressBox = document.getElementById("addressBox");

    if (data.loggedIn) {
      if (loginLink) loginLink.textContent = data.username;
      if (logoutLink) logoutLink.style.display = 'inline';
      if (addressBox) addressBox.style.display = "block";
    } else {
      if (loginLink) loginLink.textContent = 'Login';
      if (logoutLink) logoutLink.style.display = 'none';
      if (addressBox) addressBox.style.display = "none";
    }
  } catch (err) {
    console.error(err);
  }
}

const logoutLinkEl = document.getElementById('logoutLink');
if (logoutLinkEl) {
  logoutLinkEl.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'login.html';
  });
}

// ================= CART DATA =================
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ================= PRODUCTS =================
const productsGrid = document.getElementById('productsGrid');

async function loadProducts(search = "") {
  try {
    const url = search 
      ? `/api/products/search?q=${search}` 
      : `/api/products`;

    const res = await fetch(url, { credentials: 'include' });
    const products = await res.json();

    if (!productsGrid) return;
    productsGrid.innerHTML = '';

    products.forEach(p => {
      const div = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <img src="${p.image}" width="120">
        <h4>${p.name}</h4>
        <p>${p.description || ''}</p>
        <p>₹${p.price}</p>
        <button class="cartBtn">Add to Cart</button>
        <button class="wishBtn">❤️</button>
      `;

      // ADD TO CART
      div.querySelector('.cartBtn').addEventListener('click', async () => {
        const authRes = await fetch('/api/check-auth', { credentials: 'include' });
        const authData = await authRes.json();

        if (!authData.loggedIn) {
          alert("Please login first to add products.");
          window.location.href = "login.html";
          return;
        }

        addToCart(p._id, p.name, p.price, p.image);
        alert("Added to cart");
      });

      // ADD TO WISHLIST
      div.querySelector('.wishBtn').addEventListener('click', () => {
        addToWishlist(p._id);
      });

      productsGrid.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}
const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    loadProducts(query);
  });
}
// ================= CART FUNCTIONS =================
function addToCart(id, name, price, image) {
  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1, image });
  }
  saveCart();
}

function decreaseQty(id) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty -= 1;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = count;
}
// ================= WISHLIST =================

async function addToWishlist(productId) {
  try {
    const authRes = await fetch('/api/check-auth', { credentials: 'include' });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
      alert("Please login first.");
      window.location.href = "login.html";
      return;
    }

    const res = await fetch('/api/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId })
    });

    const data = await res.json();
    alert(data.message || "Added to wishlist ❤️");

  } catch (err) {
    console.error(err);
  }
}

// ================= CART MODAL =================
const viewCartBtn = document.getElementById('viewCartBtn');
const cartModal = document.getElementById('cartModal');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsDiv = document.getElementById('cartItems');
const cartTotalDiv = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

if (viewCartBtn) {
  viewCartBtn.addEventListener('click', () => {
    renderCart();
    cartModal.style.display = 'block';
  });
}

if (closeCartBtn) {
  closeCartBtn.addEventListener('click', () => {
    cartModal.style.display = 'none';
  });
}

function renderCart() {
  if (!cartItemsDiv) return;
  cartItemsDiv.innerHTML = '';
  let total = 0;

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<p>Your cart is empty</p>';
    cartTotalDiv.textContent = '';
    return;
  }

  cart.forEach(item => {
    const div = document.createElement('div');
    div.innerHTML = `
      <img src="${item.image}" width="40">
      <b>${item.name}</b><br>
      ₹${item.price} × ${item.qty} = ₹${item.price * item.qty}<br>
      <button onclick="decreaseQty('${item.id}')">−</button>
      <button onclick="addToCart('${item.id}','${item.name}',${item.price},'${item.image}')">+</button>
      <button onclick="removeFromCart('${item.id}')">Remove</button>
      <hr>
    `;
    cartItemsDiv.appendChild(div);
    total += item.price * item.qty;
  });

  cartTotalDiv.textContent = 'Total: ₹' + total;
}

// ================= PAYMENT =================

const paymentModal = document.getElementById('paymentModal');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

if (checkoutBtn) {

  checkoutBtn.addEventListener('click', async () => {

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    // ✅ LOGIN REQUIRED BEFORE CHECKOUT
    const authRes = await fetch('/api/check-auth', { credentials: 'include' });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
      alert("Please login first to checkout.");
      window.location.href = "login.html";
      return;
    }

    // ✅ Address required
    const addressInput = document.getElementById("addressInput");

    if (!addressInput || addressInput.value.trim() === "") {
      alert("Please enter delivery address first.");
      return;
    }

    paymentModal.style.display = 'block';

  });

}

if (cancelPaymentBtn) {

  cancelPaymentBtn.addEventListener('click', () => {

    paymentModal.style.display = 'none';

  });

}

if (confirmPaymentBtn) {

  confirmPaymentBtn.addEventListener('click', async () => {

    // ✅ LOGIN CHECK AGAIN
    const authRes = await fetch('/api/check-auth', { credentials: 'include' });
    const authData = await authRes.json();

    if (!authData.loggedIn) {
      alert("Session expired. Please login again.");
      window.location.href = "login.html";
      return;
    }

    // ✅ Address compulsory
    const addressInput = document.getElementById("addressInput");

    if (!addressInput || addressInput.value.trim() === "") {
      alert("Please enter delivery address before placing order.");
      return;
    }

    const paymentMethod =
      document.querySelector("input[name='payment']:checked").value;


    // ================= STRIPE PAYMENT =================

    if (paymentMethod === "Card") {

      try {

        const items = cart.map(i => ({
          productId: i.id,
          quantity: i.qty
        }));

        const address = document.getElementById("addressInput").value.trim();

        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            items,
            address,
            paymentMethod: "Stripe"
          })
        });

        if (!res.ok) {
          alert("Server error starting payment");
          return;
        }

        const data = await res.json();

        if (!data.id) {
          alert("Stripe session not created");
          return;
        }

        const stripe = Stripe("pk_test_51SrMPfRMYu5zDe22rttQM9g1sLt5rSFT72aidShxWnGiUZwbsj6ksWjjhvy58GrHhKCmxtDq9vRQtnfymxJ4LpjV00eFv8KtAb");

        const result = await stripe.redirectToCheckout({
          sessionId: data.id
        });

        if (result.error) {
          alert(result.error.message);
        }

      } catch (err) {

        console.error("Stripe Error:", err);
        alert("Payment failed. Try again.");

      }

      return;

    }


    // ================= COD ORDER =================

    const items = cart.map(i => ({
      productId: i.id,
      quantity: i.qty
    }));

    const address = document.getElementById("addressInput").value.trim();

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        items,
        paymentMethod: 'COD',
        address: address
      })
    });

    const data = await res.json();

    if (res.ok) {

      alert(data.message || "Order placed successfully");

      localStorage.removeItem('cart');
      cart = [];

      updateCartCount();

      window.location.href = 'order.html';

    } else {

      alert(data.message || "Order failed");

    }

  });

}

// ================= ADDRESS =================
async function loadUserAddress(){
  const res = await fetch("/api/user",{credentials:"include"});
  const data = await res.json();

  if(data.address){
    document.getElementById("addressInput").value = data.address;
  }
}

async function saveAddressToDB(address) {
  try {
    await fetch('/api/save-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address })
    });
  } catch (err) {
    console.error("Error saving address:", err);
  }
}

const addressInputEl = document.getElementById("addressInput");
if (addressInputEl) {
  let timer;

  addressInputEl.addEventListener("input", () => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      const address = addressInputEl.value.trim();
      if (address.length > 5) {
        saveAddressToDB(address);
      }
    }, 1200);
  });
}
async function loadWishlist() {
  const container = document.getElementById("wishlistContainer");
  if (!container) return;

  const res = await fetch('/api/wishlist', { credentials: 'include' });
  const products = await res.json();

  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No wishlist items</p>";
    return;
  }

  products.forEach(p => {
    container.innerHTML += `
      <div>
        <img src="${p.image}" width="80">
        <h4>${p.name}</h4>
        <p>₹${p.price}</p>
        <button onclick="removeFromWishlist('${p._id}')">Remove</button>
      </div>
    `;
  });
}

async function removeFromWishlist(productId) {
  await fetch('/api/wishlist/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId })
  });

  loadWishlist();
}
// ================= CUSTOM DESIGN UPLOAD =================
const customForm = document.getElementById("customUploadForm");

if (customForm) {
  customForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const fileInput = document.getElementById("designFile");
    const pageCount = Number(document.getElementById("pageCount").value);
    const size = document.getElementById("size").value;
    const address = document.getElementById("addressInput").value.trim();
    const msg = document.getElementById("uploadMsg");

    if (!fileInput.files.length) {
      msg.innerText = "Please select a file.";
      msg.style.color = "red";
      return;
    }

    if (!pageCount || pageCount <= 0) {
      msg.innerText = "Enter valid page count.";
      msg.style.color = "red";
      return;
    }

    if (!address) {
      msg.innerText = "Please enter delivery address.";
      msg.style.color = "red";
      return;
    }

    const formData = new FormData();
    formData.append("designFile", fileInput.files[0]);
    formData.append("pageCount", pageCount);
    formData.append("size", size);
    formData.append("address", address);

    try {
      const res = await fetch("/api/custom-upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const data = await res.json();

      if (res.status === 401) {
        msg.innerText = "Please login first.";
        msg.style.color = "red";
        return;
      }

      if (!res.ok) {
        msg.innerText = data.message || "Upload failed.";
        msg.style.color = "red";
        return;
      }

    const stripe = Stripe("pk_test_51SrMPfRMYu5zDe22rttQM9g1sLt5rSFT72aidShxWnGiUZwbsj6ksWjjhvy58GrHhKCmxtDq9vRQtnfymxJ4LpjV00eFv8KtAb");

await stripe.redirectToCheckout({
  sessionId: data.id
});
    } catch (err) {
      msg.innerText = "Upload failed.";
      msg.style.color = "red";
    }
  });
}
// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  updateCartCount();
  loadProducts();
  loadUserAddress();
    loadWishlist();
});