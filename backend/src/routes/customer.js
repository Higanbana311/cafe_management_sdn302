const express = require("express");
const customerRouter = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  updateMemberPoint,
  getCustomerReservations,
} = require("../controllers/customer.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { FRONT_OF_HOUSE, MANAGER } = require("../config/roles.js");

customerRouter.use(verifyToken);

customerRouter.get("/", getAllCustomers);
customerRouter.get("/search", searchCustomers);
customerRouter.get("/:id/reservations", getCustomerReservations);
customerRouter.get("/:id", getCustomerById);
customerRouter.post("/", requireRole(...FRONT_OF_HOUSE), createCustomer);
customerRouter.put("/:id", requireRole(...FRONT_OF_HOUSE), updateCustomer);
customerRouter.patch("/:id/member-points", requireRole(...FRONT_OF_HOUSE), updateMemberPoint);
customerRouter.delete("/:id", requireRole(MANAGER), deleteCustomer);
module.exports = customerRouter;
