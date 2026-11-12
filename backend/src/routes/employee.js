const express = require("express");
const employeeRouter = express.Router();
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeAccount,
  setEmployeeAccountStatus,
} = require("../controllers/employee.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, ALL_STAFF } = require("../config/roles.js");

employeeRouter.use(verifyToken);

// Every role needs the staff list for read purposes (assigning/display on orders);
// only managers manage staff records themselves.
employeeRouter.get("/", requireRole(...ALL_STAFF), getAllEmployees);
employeeRouter.get("/:id", requireRole(...ALL_STAFF), getEmployeeById);
employeeRouter.post("/", requireRole(MANAGER), createEmployee);
employeeRouter.put("/:id", requireRole(MANAGER), updateEmployee);
employeeRouter.delete("/:id", requireRole(MANAGER), deleteEmployee);
employeeRouter.put("/:id/account", requireRole(MANAGER), setEmployeeAccount);
employeeRouter.patch("/:id/account/status", requireRole(MANAGER), setEmployeeAccountStatus);

module.exports = employeeRouter;
