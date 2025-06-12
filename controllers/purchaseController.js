const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Purchase = require('../models/Purchase');
const Cart = require('../models/Cart');
const User = require('../models/User');
 const QRCode = require('qrcode');

// Email transporter configuration
 // SOLUTION 1: Updated Gmail Configuration with Better Error Handling
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587, // Use 587 instead of 465
  secure: false, // Use STARTTLS (more reliable than SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Should be App Password, not regular password
  },
  tls: {
    rejectUnauthorized: false,
  },
  // Add connection timeout and retry options
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
});

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
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Function to send purchase confirmation email
// Function to send purchase confirmation email with CID attachment
const sendPurchaseConfirmationEmail = async (userEmail, deliveryAddress, quantity, qrCodeDataURL, userUniqueId) => {
  const profileUrl = `${process.env.BACKEND_URL}/api/${userUniqueId}`;

  // Convert base64 to buffer for attachment
  let qrCodeBuffer = null;
  if (qrCodeDataURL) {
    try {
      // Remove the data URL prefix (data:image/png;base64,)
      const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
      qrCodeBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      console.error('Error converting QR code to buffer:', error);
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: 'NFC Cards Purchase Confirmation - Shipping Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">🎉 Your NFC Cards Order Confirmed!</h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745;">What's Next?</h3>
          <ul style="line-height: 1.6;">
            <li>✅ Your NFC cards are being prepared</li>
            <li>📧 Check your email for shipping details</li>
            <li>🎛️ Visit your dashboard to manage your cards</li>
            <li>🎨 Each card comes with 3 customizable profiles</li>
          </ul>
        </div>

        <div style="background-color: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333;">📦 Shipping Details</h3>
          <p><strong>Quantity:</strong> ${quantity} NFC Card(s)</p>
          <p><strong>Delivery Address:</strong></p>
          <div style="margin-left: 20px;">
            <p>${deliveryAddress.fullName}<br>
            ${deliveryAddress.addressLine1}<br>
            ${deliveryAddress.addressLine2 ? deliveryAddress.addressLine2 + '<br>' : ''}
            ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.postalCode}<br>
            ${deliveryAddress.country}<br>
            Phone: ${deliveryAddress.phoneNumber}</p>
            ${deliveryAddress.additionalInstructions ? `<p><em>Additional Instructions: ${deliveryAddress.additionalInstructions}</em></p>` : ''}
          </div>
        </div>

        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #155724;">📱 Your Profile QR Code</h3>
          <p>Scan this QR code to view your profile:</p>
          ${qrCodeBuffer ? `<img src="cid:qrcode" alt="Profile QR Code" style="max-width: 200px; margin: 10px 0; border: 1px solid #ddd;">` : '<p style="color: #721c24; background-color: #f8d7da; padding: 10px; border-radius: 4px;">QR Code could not be generated</p>'}
          <p style="margin-top: 10px;">
            <a href="${profileUrl}" style="color: #007bff; text-decoration: none;">
              ${profileUrl}
            </a>
          </p>
        </div>

        <div style="margin-top: 30px; padding: 20px; border-top: 2px solid #dee2e6;">
          <p>We'll send you tracking information once your cards are shipped.</p>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p style="color: #6c757d; font-size: 14px;">Thank you for choosing our NFC cards!</p>
        </div>
      </div>
    `,
    // Add the QR code as an attachment with CID
    attachments: qrCodeBuffer ? [{
      filename: 'qr-code.png',
      content: qrCodeBuffer,
      cid: 'qrcode', // Content-ID for referencing in HTML
      contentType: 'image/png'
    }] : []
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Purchase confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending purchase confirmation email:', error);
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
    
    // 🆕 Generate QR code and save to user
    const profileUrl = `${process.env.BACKEND_URL}/api/${user.uniqueId}`;
    const qrCodeDataURL = await generateQRCode(profileUrl);
    
    if (qrCodeDataURL) {
      user.qrCode = qrCodeDataURL;
      user.profileUrl = profileUrl;
    }
    
    await user.save();

    // Send purchase confirmation email with QR code
    await sendPurchaseConfirmationEmail(
      purchase.email, 
      purchase.deliveryAddress, 
      purchase.quantity, 
      qrCodeDataURL, 
      user.uniqueId
    );

    res.json({
      success: true,
      message: "Payment successful",
      user: { ...user._doc, uniqueId: user.uniqueId },
      purchasedQuantity: purchase.quantity,
      deliveryAddress: purchase.deliveryAddress,
      qrCode: qrCodeDataURL, // Include QR code in response
      profileUrl: profileUrl
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