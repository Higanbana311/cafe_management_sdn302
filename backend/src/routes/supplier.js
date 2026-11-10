const express = require("express");
const supplierRouter = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplier.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, KITCHEN } = require("../config/roles.js");

supplierRouter.use(verifyToken);

// Barista needs the supplier list to pick one when managing ingredients.
supplierRouter.get("/", requireRole(...KITCHEN), getAllSuppliers);
supplierRouter.get("/:id", requireRole(...KITCHEN), getSupplierById);
supplierRouter.post("/", requireRole(MANAGER), createSupplier);
supplierRouter.put("/:id", requireRole(MANAGER), updateSupplier);
supplierRouter.delete("/:id", requireRole(MANAGER), deleteSupplier);

module.exports = supplierRouter;
