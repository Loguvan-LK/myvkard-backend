// routes/purchase.js
const express = require('express');
const router = express.Router();
const { handlePurchase, handleWebhook, getPurchaseHistory } = require('../controllers/purchaseController');
const authMiddleware = require('../middleware/auth');

// Create checkout session (protected route)
router.post('/create-checkout-session', authMiddleware, handlePurchase);

// Webhook endpoint (NOT protected - Stripe calls this)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Get purchase history (protected route)
router.get('/purchase-history', authMiddleware, getPurchaseHistory);

// Get single purchase details (protected route)
router.get('/purchase/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    const purchase = await Purchase.findOne({ 
      stripeSessionId: sessionId, 
      userId 
    });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    res.json({
      success: true,
      purchase
    });
    
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase details'
    });
  }
});

module.exports = router;