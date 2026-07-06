const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // ✅ Firebase Email login support (ADDED)
   email: {
  type: String,
  unique: true,
  sparse: true,
  default: null
},
    // ✅ Auth Type (ADDED)
    authType: {
      type: String,
  enum: ["local", "firebase"],
  default: "local" // local or firebase
    },

    // ✅ Mobile number (used for OTP)
    mobile: {
      type: String,
      default: ""
    },

    // ✅ Address (already used in orders)
    address: {
      type: String,
      default: ""
    },
    totalAmount: {
  type: Number,
  default: 0
},

    // ✅ OTP fields (ADDED – no existing logic affected)
    otp: {
      type: String,
      default: null
    },

    otpExpires: {
      type: Date,
      default: null
    },

    isVerified: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
  
);

module.exports = mongoose.model('User', userSchema);
