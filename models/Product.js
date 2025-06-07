const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
      productId: { type: String, required: true, unique: true },
  name: String,
  price: Number,
  imageUrl: String,
});

module.exports = mongoose.model("Product", productSchema);