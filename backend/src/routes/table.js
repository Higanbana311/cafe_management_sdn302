const express = require("express");
const tableRouter = express.Router();
const {
  getAllTables,
  getTableById,
  getTablesByStatus,
  createTable,
  updateTable,
  deleteTable,
} = require("../controllers/table.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, ALL_STAFF } = require("../config/roles.js");

tableRouter.use(verifyToken, requireRole(...ALL_STAFF));

tableRouter.get("/", getAllTables);
tableRouter.get("/status/:status", getTablesByStatus);
tableRouter.get("/:id", getTableById);
tableRouter.post("/", requireRole(MANAGER), createTable);
tableRouter.put("/:id", requireRole(MANAGER), updateTable);
tableRouter.delete("/:id", requireRole(MANAGER), deleteTable);

module.exports = tableRouter;
