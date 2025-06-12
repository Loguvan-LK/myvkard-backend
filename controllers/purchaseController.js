const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const QRCode = require('qrcode');
const Purchase = require('../models/Purchase');
const Cart = require('../models/Cart');
const User = require('../models/User');
require('dotenv').config();
// Configure nodemailer (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 465, // or 587
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certs
  },
});


// Function to send purchase confirmation email
const sendPurchaseConfirmationEmail = async (userEmail, deliveryAddress, quantity, qrCodeDataURL, userUniqueId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'Your NFC Cards Order Confirmation - Shipping Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Order Confirmation</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">What's Next?</h3>
          <ul style="color: #333; line-height: 1.6;">
            <li>Your NFC cards are being prepared</li>
            <li>Check your email for shipping details</li>
            <li>Visit your dashboard to manage your cards</li>
            <li>Each card comes with 3 customizable profiles</li>
          </ul>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Details</h3>
          <p><strong>Quantity:</strong> ${quantity} NFC Card${quantity > 1 ? 's' : ''}</p>
        </div>

        <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${deliveryAddress.fullName}</p>
          <p style="margin: 5px 0;"><strong>Address:</strong> ${deliveryAddress.addressLine1}</p>
          ${deliveryAddress.addressLine2 ? `<p style="margin: 5px 0;">${deliveryAddress.addressLine2}</p>` : ''}
          <p style="margin: 5px 0;"><strong>City:</strong> ${deliveryAddress.city}</p>
          <p style="margin: 5px 0;"><strong>State:</strong> ${deliveryAddress.state}</p>
          <p style="margin: 5px 0;"><strong>Postal Code:</strong> ${deliveryAddress.postalCode}</p>
          <p style="margin: 5px 0;"><strong>Country:</strong> ${deliveryAddress.country}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${deliveryAddress.phoneNumber}</p>
          ${deliveryAddress.additionalInstructions ? `<p style="margin: 5px 0;"><strong>Additional Instructions:</strong> ${deliveryAddress.additionalInstructions}</p>` : ''}
        </div>

        <div style="background-color: #ffffff; border: 1px solid #dee2e6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #333; margin-top: 0;">Your NFC Profile QR Code</h3>
          <p style="color: #666; margin-bottom: 15px;">Scan this QR code to access your NFC profile:</p>
          <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; padding: 10px;">
          <p style="color: #666; margin-top: 15px; font-size: 14px;">
            Profile URL: <a href="https://myvkard-backend-omrh.onrender.com/api/${userUniqueId}" style="color: #007bff;">https://myvkard-backend-omrh.onrender.com/api/${userUniqueId}</a>
          </p>
        </div>

        <div style="background-color: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="color: #666; margin: 0; font-size: 14px; text-align: center;">
            Thank you for your purchase! We'll send you tracking information once your order ships.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Purchase confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Function to generate QR code
const generateQRCode = async (url) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

exports.handlePurchase = async (req, res) => {
  try {
    const { quantity, deliveryAddress } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate delivery address
    if (!deliveryAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery address is required' 
      });
    }

    const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !deliveryAddress[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required delivery address fields: ${missingFields.join(', ')}` 
      });
    }

    const purchase = new Purchase({
      userId,
      email: userEmail,
      quantity,
      deliveryAddress: {
        fullName: deliveryAddress.fullName,
        addressLine1: deliveryAddress.addressLine1,
        addressLine2: deliveryAddress.addressLine2 || '',
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        postalCode: deliveryAddress.postalCode,
        country: deliveryAddress.country,
        phoneNumber: deliveryAddress.phoneNumber,
        additionalInstructions: deliveryAddress.additionalInstructions || ''
      },
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
    
    if (purchase.status === 'completed') {
      return res.status(200).json({ success: true, message: "Already processed" });
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

    // 🆕 Generate QR Code for user's profile
    const profileUrl = `http://localhost:5000/api/${user.uniqueId}`;
    const qrCodeDataURL = await generateQRCode(profileUrl);

    // 🆕 Send confirmation email with delivery details and QR code
    if (qrCodeDataURL) {
      await sendPurchaseConfirmationEmail(
        purchase.email,
        purchase.deliveryAddress,
        purchase.quantity,
        qrCodeDataURL,
        user.uniqueId
      );
    }

    res.json({
      success: true,
      message: "Payment successful",
      user: { ...user._doc, uniqueId: user.uniqueId },
      purchasedQuantity: purchase.quantity,
      deliveryAddress: purchase.deliveryAddress,
      qrCode: qrCodeDataURL, // Include QR code in response
      profileUrl: profileUrl   // Include profile URL in response
    });
  } catch (error) {
    console.error("Payment Success Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process successful payment",
    });
  }
};

// New function to get purchase details with delivery address
exports.getPurchaseDetails = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user.id;

    const purchase = await Purchase.findById(purchaseId);
    
    if (!purchase) {
      return res.status(404).json({ 
        success: false, 
        message: "Purchase not found" 
      });
    }

    // Ensure user can only access their own purchases
    if (purchase.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.json({
      success: true,
      purchase: {
        id: purchase._id,
        quantity: purchase.quantity,
        status: purchase.status,
        deliveryAddress: purchase.deliveryAddress,
        timestamp: purchase.timestamp
      }
    });
  } catch (error) {
    console.error("Get Purchase Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve purchase details",
    });
  }
};

// New function to update delivery address for pending purchases
exports.updateDeliveryAddress = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const { deliveryAddress } = req.body;
    const userId = req.user.id;

    if (!deliveryAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery address is required' 
      });
    }

    const purchase = await Purchase.findById(purchaseId);
    
    if (!purchase) {
      return res.status(404).json({ 
        success: false, 
        message: "Purchase not found" 
      });
    }

    // Ensure user can only update their own purchases
    if (purchase.userId.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Only allow updates for pending purchases
    if (purchase.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot update delivery address for completed or failed purchases" 
      });
    }

    const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !deliveryAddress[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required delivery address fields: ${missingFields.join(', ')}` 
      });
    }

    purchase.deliveryAddress = {
      fullName: deliveryAddress.fullName,
      addressLine1: deliveryAddress.addressLine1,
      addressLine2: deliveryAddress.addressLine2 || '',
      city: deliveryAddress.city,
      state: deliveryAddress.state,
      postalCode: deliveryAddress.postalCode,
      country: deliveryAddress.country,
      phoneNumber: deliveryAddress.phoneNumber,
      additionalInstructions: deliveryAddress.additionalInstructions || ''
    };

    await purchase.save();

    res.json({
      success: true,
      message: "Delivery address updated successfully",
      deliveryAddress: purchase.deliveryAddress
    });
  } catch (error) {
    console.error("Update Delivery Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update delivery address",
    });
  }
};