// routes/index.js
const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { handlePurchase, handleSuccessfulPayment, getPurchaseDetails,updateDeliveryAddress  } = require("../controllers/purchaseController");
const { register, login } = require("../controllers/authController");
const { 
  addCompanyProfile, 
  removeCompanyProfile, 
  setActiveCompanyProfile, 
  updateCompanyProfile,
  getCurrentUser,  // Add this
  updateUserProfile // Add this
} = require("../controllers/userController");
const { showActiveCompanyProfile } = require("../controllers/redirectController");
const { getNFCCards, updateNFCCard } = require("../controllers/nfcController");
const authMiddleware = require("../middleware/auth");
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

// Authentication routes
router.post("/login", login);
router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-registration-otp", sendOtp);

// User routes - Add these
router.get("/user", authMiddleware, getCurrentUser);
router.put("/user", authMiddleware, updateUserProfile);

// Purchase routes
router.post("/purchase", authMiddleware, handlePurchase);
router.get("/success", handleSuccessfulPayment);
router.get('/purchase/:purchaseId', authMiddleware,getPurchaseDetails);
router.put('/purchase/:purchaseId/delivery-address', authMiddleware,updateDeliveryAddress);

// Contact management routes (Updated from URL management)
router.post("/add-company-profile", authMiddleware, addCompanyProfile);
router.post("/remove-company-profile", authMiddleware, removeCompanyProfile);
router.post("/set-active-company-profile", authMiddleware, setActiveCompanyProfile);
router.put("/update-company-profile", authMiddleware, updateCompanyProfile);

// NFC Card routes
router.get("/nfc-cards", authMiddleware, getNFCCards);
router.put("/nfc-card", authMiddleware, updateNFCCard);

// Cart routes
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.delete("/cart/:productId", authMiddleware, removeFromCart);
router.delete("/cart", authMiddleware, clearCart);

// Public route to show active contact (visiting card view)
router.get("/:uniqueId", showActiveCompanyProfile);

module.exports = router;