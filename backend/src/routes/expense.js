const express = require("express");
const expenseRouter = express.Router();
const {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expense.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER } = require("../config/roles.js");

expenseRouter.use(verifyToken, requireRole(MANAGER));

expenseRouter.get("/", getAllExpenses);
expenseRouter.get("/:id", getExpenseById);
expenseRouter.post("/", createExpense);
expenseRouter.put("/:id", updateExpense);
expenseRouter.delete("/:id", deleteExpense);

module.exports = expenseRouter;
