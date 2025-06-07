// routes/payment.js - CLEANED VERSION
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
// Remove this line: const cors = require('cors'); - CORS should be in app.js only

// Import required models
const User = require('../models/User');
const NFCCard = require('../models/NFCCard');

// Create checkout session for NFC card purchase
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, quantity = 1, userId } = req.body;

    // Validate required fields
    if (!priceId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: priceId and userId' 
      });
    }

    // Define your base URL
    const YOUR_DOMAIN = process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com'
      : 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${YOUR_DOMAIN}/payment-cancelled`,
      metadata: {
        userId: userId,
        productType: 'nfc_card',
        quantity: quantity.toString()
      },
      customer_creation: 'always',
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'IN'],
      },
    });

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Utility functions
function generateUniqueCardId() {
  return 'CARD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUniqueProfileId() {
  return 'PROF_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = router;