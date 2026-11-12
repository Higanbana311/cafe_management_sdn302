const express = require("express");
const purchaseOrderRouter = express.Router();
const {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} = require("../controllers/purchaseOrder.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, KITCHEN } = require("../config/roles.js");

purchaseOrderRouter.use(verifyToken);

// Full purchase-order history/management is manager-only, but kitchen staff
// (barista) can still create one directly from the ingredients "stock in" flow
// so a cost record always exists when they add stock.
purchaseOrderRouter.get("/", requireRole(MANAGER), getAllPurchaseOrders);
purchaseOrderRouter.get("/:id", requireRole(MANAGER), getPurchaseOrderById);
purchaseOrderRouter.post("/", requireRole(...KITCHEN), createPurchaseOrder);
purchaseOrderRouter.put("/:id", requireRole(MANAGER), updatePurchaseOrder);
purchaseOrderRouter.delete("/:id", requireRole(MANAGER), deletePurchaseOrder);

module.exports = purchaseOrderRouter;
