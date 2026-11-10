const express = require("express");
const orderRouter = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/order.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, CASHIER, FRONT_OF_HOUSE, ALL_STAFF } = require("../config/roles.js");

orderRouter.use(verifyToken);

orderRouter.get("/", requireRole(...ALL_STAFF), getAllOrders);
orderRouter.get("/:id", requireRole(...ALL_STAFF), getOrderById);
// A waiter can take an order, but editing one after the fact (items, discount,
// payment) is a cashier/manager job.
orderRouter.post("/", requireRole(...FRONT_OF_HOUSE), createOrder);
orderRouter.put("/:id", requireRole(MANAGER, CASHIER), updateOrder);
// Barista only moves an order through its prep stages, never edits or deletes it.
orderRouter.patch("/:id/status", requireRole(...ALL_STAFF), updateOrderStatus);
orderRouter.delete("/:id", requireRole(MANAGER), deleteOrder);

module.exports = orderRouter;
