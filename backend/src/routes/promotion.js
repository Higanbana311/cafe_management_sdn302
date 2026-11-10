const express = require("express");
const promotionRouter = express.Router();
const {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotionCode,
} = require("../controllers/promotion.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, FRONT_OF_HOUSE } = require("../config/roles.js");

promotionRouter.use(verifyToken);

// Cashier/Waiter need to look up and validate a code while building an order;
// only managers create/manage promotions.
promotionRouter.get("/", requireRole(...FRONT_OF_HOUSE), getAllPromotions);
promotionRouter.get("/validate/:code", requireRole(...FRONT_OF_HOUSE), validatePromotionCode);
promotionRouter.get("/:id", requireRole(...FRONT_OF_HOUSE), getPromotionById);
promotionRouter.post("/", requireRole(MANAGER), createPromotion);
promotionRouter.put("/:id", requireRole(MANAGER), updatePromotion);
promotionRouter.delete("/:id", requireRole(MANAGER), deletePromotion);

module.exports = promotionRouter;
