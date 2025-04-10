const Product = require("../models/Product");

const productController = {
  // Lấy tất cả sản phẩm
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (err) {
      console.error("Get products error:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy sản phẩm", error: err.message });
    }
  },

  // Lấy sản phẩm theo ID
  getProductById: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error("Get product by ID error:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi lấy sản phẩm", error: err.message });
    }
  },

  // Thêm sản phẩm mới
  createProduct: async (req, res) => {
    try {
      let productsToCreate = [];
      if (Array.isArray(req.body)) {
        // Nếu là mảng, tạo nhiều sản phẩm
        productsToCreate = req.body.map((productData) => {
          const {
            name,
            image,
            category,
            brand,
            originalPrice,
            discountedPrice,
            description,
            specifications,
            stock,
            isNewProduct,
            isOnSale,
            salePercentage,
          } = productData;
          return new Product({
            name,
            image,
            category,
            brand,
            originalPrice,
            discountedPrice,
            description,
            specifications,
            stock,
            isNewProduct,
            isOnSale,
            salePercentage,
          });
        });
      } else {
        // Nếu là object đơn, tạo một sản phẩm
        const {
          name,
          image,
          category,
          brand,
          originalPrice,
          discountedPrice,
          description,
          specifications,
          stock,
          isNewProduct,
          isOnSale,
          salePercentage,
        } = req.body;
        productsToCreate.push(
          new Product({
            name,
            image,
            category,
            brand,
            originalPrice,
            discountedPrice,
            description,
            specifications,
            stock,
            isNewProduct,
            isOnSale,
            salePercentage,
          })
        );
      }

      const products = await Product.insertMany(productsToCreate);
      res.status(201).json(products);
    } catch (err) {
      console.error("Create product error:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi tạo sản phẩm", error: err.message });
    }
  },

  // Cập nhật sản phẩm
  updateProduct: async (req, res) => {
    try {
      const {
        name,
        image,
        category,
        brand,
        originalPrice,
        discountedPrice,
        description,
        specifications,
        stock,
        isNewProduct,
        isOnSale,
        salePercentage,
      } = req.body;
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name,
          image,
          category,
          brand,
          originalPrice,
          discountedPrice,
          description,
          specifications,
          stock,
          isNewProduct,
          isOnSale,
          salePercentage,
        },
        { new: true, runValidators: true }
      );
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error("Update product error:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi cập nhật sản phẩm", error: err.message });
    }
  },

  // Xóa sản phẩm
  deleteProduct: async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Sản phẩm không tồn tại" });
      }
      res.status(200).json({ message: "Sản phẩm đã được xóa" });
    } catch (err) {
      console.error("Delete product error:", err);
      res
        .status(500)
        .json({ message: "Lỗi khi xóa sản phẩm", error: err.message });
    }
  },
};

module.exports = productController;
