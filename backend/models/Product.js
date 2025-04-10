const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Laptop", "Điện Thoại", "Camera", "Phụ Kiện"],
    },
    brand: {
      type: String,
      required: true,
      enum: [
        "Apple",
        "Samsung",
        "Dell",
        "HP",
        "Lenovo",
        "Asus",
        "Sony",
        "Nikon",
        "Canon",
      ],
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    specifications: {
      type: Map,
      of: String,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isNewProduct: {
      type: Boolean,
      default: false,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    salePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true, suppressReservedKeysWarning: true } // Thêm để tắt cảnh báo
);

module.exports = mongoose.model("Product", productSchema);
