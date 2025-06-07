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
    console.log("Session ID:", session_id);
    console.log("Purchase ID:", purchase_id);

    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Session payment_status:", session.payment_status);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    // ✅ Check if this purchase is already completed
    const purchase = await Purchase.findById(purchase_id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    
    if (!purchase || purchase.status === 'completed') {
      return res.status(200).json({ success: true, message: "Already processed" });
    }
    if (purchase.status === "completed") {
      // Already processed – return without updating again
      return res.json({
        success: true,
        message: "Payment already processed",
        purchasedQuantity: purchase.quantity,
      });
    }

    // ✅ Update the purchase as completed
    purchase.status = "completed";
    await purchase.save();

    // Clear cart
    await Cart.findOneAndUpdate(
      { userId: purchase.userId },
      { $set: { items: [] } }
    );

    // Update user
    const user = await User.findById(purchase.userId);
    user.nfcCardCount += purchase.quantity;
    await user.save();

    res.json({
      success: true,
      message: "Payment successful",
      user: { ...user._doc, uniqueId: user.uniqueId },
      purchasedQuantity: purchase.quantity,
    });
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process successful payment",
    });
  }
};
