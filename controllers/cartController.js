const Cart = require("../models/Cart");
const Product = require("../models/Product");

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ items: [] });
    }

    const detailedItems = await Promise.all(
      cart.items.map(async (item) => {
        try {
          const product = await Product.findOne({ productId: item.productId });
          if (!product) {
            console.warn(`Product not found for ID: ${item.productId}`);
            return null;
          }

          return {
            productId: item.productId,
            quantity: item.quantity,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
          };
        } catch (err) {
          console.error(`Failed to fetch product ${item.productId}`, err);
          return null;
        }
      })
    );

    const validItems = detailedItems.filter(Boolean);

    res.status(200).json({ items: validItems });
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ message: "Failed to retrieve cart" });
  }
};

exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user.id });

    if (!cart) {
      cart = new Cart({
        userId: req.user.id,
        items: [{ productId, quantity }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    res.status(200).json({ message: "Item added", cart });
  } catch (err) {
    console.error("Add to Cart Error:", err);
    res.status(500).json({ message: "Failed to add item" });
  }
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(item => item.productId !== productId);
    await cart.save();

    res.status(200).json({ message: "Item removed", cart });
  } catch (err) {
    console.error("Remove from Cart Error:", err);
    res.status(500).json({ message: "Failed to remove item" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: [] } }
    );
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Clear Cart Error:", err);
    res.status(500).json({ message: "Failed to clear cart" });
  }
};