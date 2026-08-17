const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const adminRoutes = require('./routes/adminRoutes');
const Wishlist = require('./models/Wishlist');

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
   secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));


/* ================= UPLOAD FOLDER ================= */

if(!fs.existsSync("uploads")){
  fs.mkdirSync("uploads");
}

/* ================= MULTER ================= */

const storage = multer.diskStorage({

 destination:function(req,file,cb){
  cb(null,"uploads/")
 },

 filename:function(req,file,cb){
  cb(null,Date.now()+"-"+file.originalname)
 }

});

const upload = multer({storage});

/* ================= ADMIN LOGIN ================= */

app.post('/api/admin/login',(req,res)=>{

 const {username,password}=req.body;

 if(username==="admin" && password==="admin123"){

  req.session.isAdmin = true;

  req.session.save(() => {
    res.json({ message:"Admin login successful" });
  });

 } else {
  res.status(401).json({message:"Invalid admin credentials"});
 }

});

app.use('/api/admin',adminRoutes)

/* ================= REGISTER ================= */

app.post('/api/register', async (req, res) => {

  try {

    const { username, password, address } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }
if (password.length < 5 || password.length > 7) {
  msgEl.textContent = "Password must be 5 to 7characters only";
  return;
}
    const existing = await User.findOne({ username });

    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashed,
      address: address || "",
      authType: "local",
      isVerified: true
    });

    await user.save();

    res.json({ message: "Registered successfully" });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Registration failed" });

  }

});
/* ================= LOGIN ================= */

app.post('/api/login',async(req,res)=>{

 try{

 const {username,password}=req.body

 const user = await User.findOne({username})

 if(!user)
 return res.status(400).json({message:"Invalid credentials"})

 const match = await bcrypt.compare(password,user.password)

 if(!match)
 return res.status(400).json({message:"Invalid credentials"})

 req.session.userId = user._id
 req.session.username = user.username

 res.json({message:"Login successful",username:user.username})

 }catch(err){

 console.error(err)
 res.status(500).json({message:"Login failed"})

 }

})
app.post("/api/firebase-login", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email)
      return res.status(400).json({ message: "Email required" });

    let user = await User.findOne({ email });

    if (!user) {

      user = new User({
        username: email.split("@")[0],
        email: email,
        password: "firebase-user",
        authType: "firebase",
        isVerified: true
      });

      await user.save();
    }

    req.session.userId = user._id;
    req.session.username = user.username;

    res.json({
      message: "Firebase login success",
      username: user.username
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Firebase login failed" });

  }

});

/* ================= CHECK AUTH ================= */

app.get('/api/check-auth',async(req,res)=>{

 if(!req.session.userId)
 return res.json({loggedIn:false})

 const user = await User.findById(req.session.userId)

 if(!user)
 return res.json({loggedIn:false})

 res.json({
  loggedIn:true,
  username:user.username
 })

})
/* ================= GET USER ADDRESS ================= */

app.get("/api/user", async (req,res)=>{

if(!req.session.userId)
return res.status(401).json({});

const user = await User.findById(req.session.userId);

res.json({
username:user.username,
address:user.address
});

});


/* ================= LOGOUT ================= */

app.post('/api/logout',(req,res)=>{

 req.session.destroy(()=>{
  res.json({message:"Logged out"})
 })

})

/* ================= PRODUCTS ================= */

app.get('/api/products', async (req, res) => {

 const products = await Product.find()
 res.json(products)

})
// 🔍 SEARCH PRODUCTS
app.get('/api/products/search', async (req, res) => {
  try {
    const query = req.query.q || "";

    const products = await Product.find({
      name: { $regex: query, $options: 'i' }
    });

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search error" });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {

  try {

    const items = req.body.items;

    const products = await Product.find({
      _id: { $in: items.map(i => i.productId) }
    });

    const line_items = items.map(item => {

      const product = products.find(
        p => p._id.toString() === item.productId
      );

      if(!product) throw new Error("Product not found");

      return {

        price_data:{
          currency:"inr",
          product_data:{
            name: product.name
          },
          unit_amount: product.price * 100
        },

        quantity: item.quantity

      };

    });

    // ✅ CALCULATE TOTAL AMOUNT
    const totalAmount = line_items.reduce(
      (sum, item) => sum + (item.price_data.unit_amount * item.quantity) / 100,0);
    // ✅ STRIPE MINIMUM PAYMENT CHECK
    if (totalAmount < 0) {
      return res.status(400).json({
        message: "Minimum online payment amount is ₹0. Please add more items or use COD."
      });
    }

    const session = await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      line_items: line_items,

      mode: "payment",

      success_url: "http://localhost:5000/order.html",

      cancel_url: "http://localhost:5000/cancel.html"
    });

    // ✅ SAVE ORDER IN DATABASE
    const userId = req.session.userId || null;
    const address = req.body.address || "";
    const otp = Math.floor(100000 + Math.random() * 900000);

    await Order.create({
      userId: userId,
      items: items,
      paymentMethod: "Stripe",
      totalAmount: totalAmount,
      address: address,
      status: "Paid",
      otp: otp,
    });

    res.json({ id: session.id });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Stripe session error" });

  }

});
/* ================= PLACE ORDER ================= */

app.post('/api/order', async (req, res) => {

  try {

    if (!req.session.userId)
      return res.status(401).json({ message: 'Not logged in' });

    const { items, paymentMethod, address } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });

    let totalAmount = 0;

    for (const item of items) {

      const product = await Product.findById(item.productId);

      if (product) {
        totalAmount += product.price * item.quantity;
      }

    }

 const user = await User.findById(req.session.userId);

// Save address only first time
if (!user.address && address) {
  user.address = address;
  await user.save();
}

const order = new Order({
  userId: req.session.userId,
  items,
  paymentMethod,
  address: user.address,
  totalAmount,
  status: "Order Placed",
  otp: Math.floor(100000 + Math.random() * 900000) // Generate 6-digit OTP
});
    await order.save();

    res.json({ message: 'Order placed successfully' });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Order failed' });

  }

});
/* ================= USER ORDERS ================= */
app.get('/api/orders', async (req, res) => {

  try {

    if (!req.session.userId) {
      return res.status(401).json([]);
    }

    // FETCH ORDERS FROM DB
    const orders = await Order.find({ userId: req.session.userId })
      .populate({
        path: 'items.productId',
        model: 'Product'
      })
      .sort({ createdAt: -1 });
//DELIVERY DATE
    const updatedOrders = orders.map(order => {
      const deliveryDate = new Date(order.createdAt);
      deliveryDate.setDate(deliveryDate.getDate() + 5);

      return {
        ...order.toObject(),
        deliveryDate: deliveryDate
      };
    });

    res.json(updatedOrders);

  } catch (error) {

    console.error("Order history error:", error);
    res.status(500).json({ message: "Error loading product history" });

  }

  
});
// CANCEL ORDER
app.post('/api/order/cancel/:orderId', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only allow cancellation if the order belongs to the logged-in user
    if (order.userId.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow canceling orders that are not already delivered or canceled
    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot cancel ${order.status} order` });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
});
/* ================= CUSTOM DESIGN ================= */

app.post('/api/custom-upload', upload.single('designFile'), async (req, res) => {

  try {

    if (!req.session.userId)
      return res.status(401).json({ message: 'Not logged in' });

    if (!req.file)
      return res.status(400).json({ message: 'No file uploaded' });

    const pageCount = parseInt(req.body.pageCount) || 1;
    const size = req.body.size || "B";   // C = Color, B = Black & White
    const address = req.body.address;

    //  PRICE PER PAGE
    let pricePerPage = 2;

    if (size === "C") pricePerPage = 10;  // Color
    if (size === "B") pricePerPage = 2;   // Black & White

  const deliveryCharge = 50;
const totalAmount = (pageCount * pricePerPage) + deliveryCharge;
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],

  line_items: [
    {
      price_data: {
        currency: "inr",
        product_data: {
          name: `Printing (${size === "C" ? "Color" : "B/W"}) - ${pageCount} pages + Delivery`
        },
        unit_amount: totalAmount * 100
      },
      quantity: 1
    }
  ],

  mode: "payment",

  success_url: "http://localhost:5000/order.html",
  cancel_url: "http://localhost:5000/cancel.html"
});

    const user = await User.findById(req.session.userId);

    // ✅ GENERATE OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    const order = new Order({
  userId: req.session.userId,
  uploadedFile: req.file.filename,
  originalFileName: req.file.originalname,
  pageCount,
  size,
  address: address || user.address || "",
  totalAmount,
  paymentMethod: "Stripe",   
  status: "Paid",            
  otp: otp
});

    await order.save();

    res.json({
  id: session.id
});

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: 'Upload failed' });

  }

});

/* ================= ORDER TRACKING ================= */

app.get('/api/order/:orderId', async (req, res) => {

  try {

    const order = await Order.findById(req.params.orderId)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      orderId: order._id,
      status: order.status,
      address: order.address || "No address",
      pageCount: order.pageCount,
      size: order.size,
      items: order.items,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    });

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Tracking failed" });

  }

});

app.get("/api/bill/:id", async (req, res) => {

const order = await Order
.findById(req.params.id)
.populate("items.productId")
.populate("userId");   // to get customer name

const date = new Date(order.createdAt).toLocaleDateString();

let itemsHTML = "";

// PRODUCT ORDERS
if (order.items && order.items.length > 0) {

itemsHTML = `
<tr>
<th>Item</th>
<th>Quantity</th>
<th>Total</th>
</tr>

${order.items.map(i => `
<tr>
<td>${i.productId?.name || "Product"}</td>
<td>${i.quantity}</td>
<td>${i.productId ? i.productId.price * i.quantity : "N/A"}</td>
</tr>
`).join("")}
`;

}

// CUSTOM PRINT ORDER
else if (order.pageCount) {

const pages = Number(order.pageCount) || 1;
const delivery = 50;

// ✅ SET PER PAGE BASED ON TYPE
let perPage = 2; // default B/W

if (order.size === "C") {
  perPage = 10; // Color
}

// ✅ CALCULATE PRINTING COST
const printingCost = perPage * pages;

// ✅ TOTAL
const totalAmount = printingCost + delivery;

itemsHTML = `
<tr>
<th>Pages</th>
<th>Type</th>
<th>Printing</th>
<th>Delivery</th>
<th>Total</th>
</tr>

<tr>
<td>${pages}</td>
<td>${order.size === "C" ? "Color" : "Black & White"}</td>
<td>₹${printingCost}</td>
<td>₹${delivery}</td>
<td>₹${totalAmount}</td>
</tr>
`;
}

res.send(`
<!DOCTYPE html>
<html>
<head>
<title>Invoice</title>

<style>

body{
font-family:Arial;
background:#f4f4f4;
padding:40px;
}

.invoice{
max-width:800px;
margin:auto;
background:white;
padding:30px;
border-radius:8px;
box-shadow:0 0 10px rgba(0,0,0,0.15);
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
}

.store{
font-size:26px;
font-weight:bold;
color:#333;
}

table{
width:100%;
border-collapse:collapse;
margin-top:20px;
}

th{
background:#333;
color:white;
padding:10px;
}

td{
padding:10px;
border-bottom:1px solid #ddd;
}

.total{
text-align:right;
margin-top:20px;
font-size:20px;
font-weight:bold;
}

button{
margin-top:20px;
padding:10px 20px;
background:#28a745;
color:white;
border:none;
border-radius:5px;
cursor:pointer;
}

</style>

</head>

<body>

<div class="invoice">

<div class="header">
<div class="store">Morya Stationery</div>
<div>Invoice</div>
</div>

<hr>

<p><b>Customer Name:</b> ${order.userId?.username || "Customer"}</p>
<p><b>Order ID:</b> ${order._id}</p>
<p><b>Date:</b> ${date}</p>
<p><b>Status:</b> ${order.status}</p>
<p><b>Payment Method:</b> ${order.paymentMethod || "COD on Print"}</p>
<p><b>Address:</b> ${order.address || ""}</p>

<table>
${itemsHTML}
</table>
<button onclick="window.print()">Print Invoice</button>
</center>

</div>

</body>
</html>
`);

});
/* ================= WISHLIST ================= */

//  ADD TO WISHLIST
app.post('/api/wishlist/add', async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not logged in" });

    const { productId } = req.body;
    const userId = req.session.userId;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
    }

    await wishlist.save();

    res.json({ message: "Added to wishlist ❤️" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding wishlist" });
  }
});

// GET WISHLIST
app.get('/api/wishlist', async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).json([]);

    const wishlist = await Wishlist.findOne({
      userId: req.session.userId
    }).populate('products'); 
    if (!wishlist) return res.json([]);

    res.json(wishlist.products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading wishlist" });
  }
});

app.post('/api/wishlist/remove', async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).json({ message: "Not logged in" });

    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({
      userId: req.session.userId
    });

    if (!wishlist)
      return res.json({ message: "Wishlist empty" });

    wishlist.products = wishlist.products.filter(
      id => id.toString() !== productId
    );

    await wishlist.save();

    res.json({ message: "Removed from wishlist" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error removing item" });
  }
});
/* ================= ADMIN ORDERS ================= */
app.get('/api/admin/orders', async (req, res) => {

  try {

    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const orders = await Order.find()
      .populate('items.productId')
      .populate({
        path: 'userId',
        model: 'User',
        select: 'username address'
      })
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading admin orders" });
  }

});
/* ================= STATIC FILES ================= */

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});