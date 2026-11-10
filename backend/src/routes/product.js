const express = require("express");
const productRouter = express.Router();
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  toggleAvailability,
  deleteProduct,
} = require("../controllers/product.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, KITCHEN, ALL_STAFF } = require("../config/roles.js");

productRouter.use(verifyToken, requireRole(...ALL_STAFF));

productRouter.get("/", getAllProducts);
productRouter.get("/category/:categoryId", getProductsByCategory);
productRouter.get("/:id", getProductById);
productRouter.post("/", requireRole(MANAGER), createProduct);
productRouter.put("/:id", requireRole(MANAGER), updateProduct);
// Barista can mark a product sold out without full edit rights over its recipe/price.
productRouter.patch("/:id/availability", requireRole(...KITCHEN), toggleAvailability);
productRouter.delete("/:id", requireRole(MANAGER), deleteProduct);

module.exports = productRouter;
