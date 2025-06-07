const express = require("express");
const router = express.Router();
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { handlePurchase, handleSuccessfulPayment } = require("../controllers/purchaseController");
const { register, login } = require("../controllers/authController");
const { addUrl, removeUrl, setActiveUrl } = require("../controllers/userController");
const { redirectToActiveUrl } = require("../controllers/redirectController");
const authMiddleware = require("../middleware/auth");
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");

router.post("/login", login);
router.post("/register", register);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/send-registration-otp", sendOtp);
router.post("/purchase", authMiddleware, handlePurchase);
router.get("/success", handleSuccessfulPayment);
router.post("/add-url", authMiddleware, addUrl);
router.post("/remove-url", authMiddleware, removeUrl);
router.post("/set-active-url", authMiddleware, setActiveUrl);
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.delete("/cart/:productId", authMiddleware, removeFromCart);
router.delete("/cart", authMiddleware, clearCart);
router.get("/:uniqueId", redirectToActiveUrl);

module.exports = router;