const express = require('express');
const router = express.Router();

const Product = require('../models/Product');
const Order = require('../models/Order');

/* ================= ADMIN PRODUCTS ================= */

// Add product
router.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Product add failed' });
  }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

/* ================= ADMIN ORDERS ================= */

// Update order status
router.put('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Order update failed' });
  }
});

module.exports = router;
function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.add('hidden');
  });

  document.getElementById(id).classList.remove('hidden');
}
async function updateOrderStatus(orderId, status) {
  await fetch(`/api/admin/orders/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}
