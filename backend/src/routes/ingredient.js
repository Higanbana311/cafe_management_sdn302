const express = require("express");
const ingredientRouter = express.Router();
const {
  getAllIngredients,
  getLowStockIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  adjustStock,
  deleteIngredient,
} = require("../controllers/ingredient.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, KITCHEN } = require("../config/roles.js");

ingredientRouter.use(verifyToken, requireRole(...KITCHEN));

ingredientRouter.get("/", getAllIngredients);
ingredientRouter.get("/low-stock", getLowStockIngredients);
ingredientRouter.get("/:id", getIngredientById);
ingredientRouter.post("/", createIngredient);
ingredientRouter.put("/:id", updateIngredient);
ingredientRouter.patch("/:id/stock", adjustStock);
// Deleting the record outright (vs. adjusting stock) could orphan references
// in product recipes or purchase orders, so that's manager-only.
ingredientRouter.delete("/:id", requireRole(MANAGER), deleteIngredient);

module.exports = ingredientRouter;
