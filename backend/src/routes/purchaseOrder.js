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
const { MANAGER } = require("../config/roles.js");

purchaseOrderRouter.use(verifyToken, requireRole(MANAGER));

purchaseOrderRouter.get("/", getAllPurchaseOrders);
purchaseOrderRouter.get("/:id", getPurchaseOrderById);
purchaseOrderRouter.post("/", createPurchaseOrder);
purchaseOrderRouter.put("/:id", updatePurchaseOrder);
purchaseOrderRouter.delete("/:id", deletePurchaseOrder);

module.exports = purchaseOrderRouter;
