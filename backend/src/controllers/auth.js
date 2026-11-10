const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employee = require("../models/employee");

const sanitizeEmployee = (employee) => {
  const obj = employee.toObject();
  if (obj.account) delete obj.account.passwordHash;
  return obj;
};

const signToken = (employee) =>
  jwt.sign(
    { id: employee._id, username: employee.account.username, role: employee.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      role,
      permissions,
      salary,
      hireDate,
      status,
      username,
      password,
    } = req.body;

    if (
      !name ||
      !phone ||
      !email ||
      !role ||
      salary === undefined ||
      !hireDate ||
      !status ||
      !username ||
      !password
    ) {
      return res.status(400).json({
        message:
          "name, phone, email, role, salary, hireDate, status, username and password are required.",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    if (await Employee.findOne({ email })) {
      return res.status(400).json({ message: "Employee with this email already exists." });
    }
    if (await Employee.findOne({ phone })) {
      return res.status(400).json({ message: "Employee with this phone number already exists." });
    }
    if (await Employee.findOne({ "account.username": username })) {
      return res.status(400).json({ message: "Username is already taken." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await new Employee({
      name,
      phone,
      email,
      role,
      permissions: permissions || [],
      account: { username, passwordHash, isActive: true },
      salary,
      hireDate,
      status,
    }).save();

    const token = signToken(employee);
    res.status(201).json({ token, employee: sanitizeEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const employee = await Employee.findOne({ "account.username": username });
    if (!employee || !employee.account) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    if (!employee.account.isActive) {
      return res.status(403).json({ message: "This account has been deactivated." });
    }
    const isMatch = await bcrypt.compare(password, employee.account.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = signToken(employee);
    res.json({ token, employee: sanitizeEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    res.json(sanitizeEmployee(employee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe };
