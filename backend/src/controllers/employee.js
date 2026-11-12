const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Employee = require("../models/employee");
const Order = require("../models/order");
const Expense = require("../models/expense");
const PurchaseOrder = require("../models/purchaseOrder");

const isValidId = (id) => mongoose.isValidObjectId(id);

const sanitize = (employee) => {
  const obj = employee.toObject();
  if (obj.account) delete obj.account.passwordHash;
  return obj;
};

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees.map(sanitize));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json(sanitize(employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, phone, email, role, permissions, salary, hireDate, status } = req.body;
    if (!name || !phone || !email || !role || salary === undefined || !hireDate || !status) {
      return res.status(400).json({
        message: "name, phone, email, role, salary, hireDate and status are required.",
      });
    }
    if (await Employee.findOne({ email })) {
      return res.status(400).json({ message: "Employee with this email already exists." });
    }
    if (await Employee.findOne({ phone })) {
      return res.status(400).json({ message: "Employee with this phone number already exists." });
    }
    const savedEmployee = await new Employee({
      name,
      phone,
      email,
      role,
      permissions: permissions || [],
      salary,
      hireDate,
      status,
    }).save();
    res.status(201).json(sanitize(savedEmployee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role, permissions, salary, hireDate, status } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }
    if (!name || !phone || !email || !role || salary === undefined || !hireDate || !status) {
      return res.status(400).json({
        message: "name, phone, email, role, salary, hireDate and status are required.",
      });
    }
    if (await Employee.findOne({ email, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Employee email must be unique." });
    }
    if (await Employee.findOne({ phone, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Employee phone number must be unique." });
    }
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, phone, email, role, permissions: permissions || [], salary, hireDate, status },
      { new: true, runValidators: true },
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json(sanitize(employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }
    const target = await Employee.findById(id);
    if (!target) {
      return res.status(404).json({ message: "Employee not found." });
    }
    if (target.role === "Manager") {
      return res.status(400).json({ message: "Manager accounts cannot be deleted." });
    }
    const [hasOrders, hasExpenses, hasPurchaseOrders] = await Promise.all([
      Order.exists({ employeeId: id }),
      Expense.exists({ employeeId: id }),
      PurchaseOrder.exists({ employeeId: id }),
    ]);
    if (hasOrders || hasExpenses || hasPurchaseOrders) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this employee still has orders, expenses or purchase orders recorded against them." });
    }
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json({ message: "Employee deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setEmployeeAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, isActive } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }
    if (!username || !password) {
      return res.status(400).json({ message: "username and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (await Employee.findOne({ "account.username": username, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Username is already taken." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await Employee.findByIdAndUpdate(
      id,
      { account: { username, passwordHash, isActive: isActive !== false } },
      { new: true, runValidators: true },
    );
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json(sanitize(employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const setEmployeeAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid employee id." });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean." });
    }
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    if (!employee.account) {
      return res.status(400).json({ message: "This employee has no login account yet." });
    }
    if (!isActive && employee.role === "Manager") {
      return res.status(400).json({ message: "Manager accounts cannot be locked." });
    }
    employee.account.isActive = isActive;
    await employee.save();
    res.json(sanitize(employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeAccount,
  setEmployeeAccountStatus,
};
