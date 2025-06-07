const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../models/Purchase');
const Cart = require('../models/Cart');
const User = require('../models/User');

exports.handlePurchase = async (req, res) => {
  try {
    const { quantity } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    const purchase = new Purchase({
      userId,
      email: userEmail,
      quantity,
      status: 'pending'
    });
    await purchase.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: quantity,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchase._id}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cancel`,
      customer_email: userEmail,
      metadata: {
        userId: userId.toString(),
        purchaseId: purchase._id.toString(),
        quantity: quantity.toString()
      }
    });

    purchase.stripeSessionId = session.id;
    await purchase.save();

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Purchase Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create purchase session' });
  }
};

exports.handleSuccessfulPayment = async (req, res) => {
  try {
    const { session_id, purchase_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status === 'paid') {
      const purchase = await Purchase.findByIdAndUpdate(
        purchase_id,
        { status: 'completed' },
        { new: true }
      );

      if (purchase) {
        await Cart.findOneAndUpdate(
          { userId: purchase.userId },
          { $set: { items: [] } }
        );

        const user = await User.findById(purchase.userId);
        user.nfcCardCount += purchase.quantity;
        await user.save();

        res.json({ 
          success: true, 
          message: 'Payment successful',
          user: { ...user._doc, uniqueId: user.uniqueId }
        });
      } else {
        res.status(404).json({ success: false, message: 'Purchase not found' });
      }
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Payment Success Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process successful payment' });
  }
};