const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const middlewareController = require("../controllers/middlewareController");

// Lấy tất cả sản phẩm (bảo vệ bằng token nếu cần)
router.get(
  "/",
  middlewareController.verifyToken,
  productController.getAllProducts
);

// Lấy sản phẩm theo ID
router.get(
  "/:id",
  middlewareController.verifyToken,
  productController.getProductById
);

// Thêm sản phẩm mới (chỉ admin)
router.post(
  "/",
  middlewareController.verifyTokenAndAdminAuth,
  productController.createProduct
);

// Cập nhật sản phẩm (chỉ admin)
router.put(
  "/:id",
  middlewareController.verifyTokenAndAdminAuth,
  productController.updateProduct
);

// Xóa sản phẩm (chỉ admin)
router.delete(
  "/:id",
  middlewareController.verifyTokenAndAdminAuth,
  productController.deleteProduct
);

module.exports = router;
