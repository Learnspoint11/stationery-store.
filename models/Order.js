const mongoose = require("mongoose"); 

const orderSchema = new mongoose.Schema({

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  /* ================= PRODUCT ORDERS ================= */

  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product" 
      },

      quantity: {
        type: Number,
        default: 1
      },

      pageCount: {
        type: Number,
        default: 1
      }
    }
  ],

  paymentMethod: {
    type: String,
    default: ""
  },

  address: {
    type: String,
    default: ""
  },
  
otp:{
type:Number
},
  /* ================= CUSTOM PRINT ORDER ================= */

  uploadedFile: {
    type: String,
    default: ""
  },

  originalFileName: {
    type: String,
    default: ""
  },

  pageCount: {
    type: Number,
    default: 1
  },

  size: {
    type: String,
    default: "A4"
  },

  /* ================= BILLING ================= */

  totalAmount: {
    type: Number,
    default: 0
  },

  /* ================= ORDER STATUS ================= */

  status: { 
    type: String, 
    default: "Order Placed" 
  }

}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);