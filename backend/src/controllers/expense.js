const mongoose = require("mongoose");
const Expense = require("../models/expense");
const Employee = require("../models/employee");

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllExpenses = async (req, res) => {
  try {
    res.json(await Expense.find().sort({ expenseDate: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExpenseById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid expense id." });
    }
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const { expenseCode, category, description, amount, expenseDate, employeeId, paymentMethod } =
      req.body;
    if (
      !expenseCode ||
      !category ||
      !description ||
      amount === undefined ||
      !expenseDate ||
      !employeeId ||
      !paymentMethod
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    if (await Expense.findOne({ expenseCode })) {
      return res.status(400).json({ message: "Expense code must be unique." });
    }
    const savedExpense = await new Expense({
      expenseCode,
      category,
      description,
      amount,
      expenseDate,
      employeeId,
      paymentMethod,
    }).save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { expenseCode, category, description, amount, expenseDate, employeeId, paymentMethod } =
      req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid expense id." });
    }
    if (
      !expenseCode ||
      !category ||
      !description ||
      amount === undefined ||
      !expenseDate ||
      !employeeId ||
      !paymentMethod
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    if (await Expense.findOne({ expenseCode, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Expense code must be unique." });
    }
    const expense = await Expense.findByIdAndUpdate(
      id,
      { expenseCode, category, description, amount, expenseDate, employeeId, paymentMethod },
      { new: true, runValidators: true },
    );
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid expense id." });
    }
    const deletedExpense = await Expense.findByIdAndDelete(id);
    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json({ message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
