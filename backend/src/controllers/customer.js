const mongoose = require("mongoose");
const Customer = require("../models/customer");
const Reservation = require("../models/reservation");
const Table = require("../models/table");
const Order = require("../models/order");

const isValidCustomerId = (id) => mongoose.isValidObjectId(id);
const isValidStatus = (status) =>
  typeof status === "string" &&
  ["active", "inactive"].includes(status.toLowerCase());

const getAllCustomers = async (req, res) => {
  try {
    res.json(await Customer.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerById = async (req, res) => {
  try {
    if (!isValidCustomerId(req.params.id))
      return res.status(400).json({ message: "Invalid customer id." });
    const customer = await Customer.findById(req.params.id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, tier, status } = req.body;
    if (!name || !phone || !email || !tier || !isValidStatus(status)) {
      return res
        .status(400)
        .json({
          message: "Name, phone, email, tier, and a valid status are required.",
        });
    }
    if (await Customer.findOne({ email }))
      return res
        .status(400)
        .json({ message: "Customer with this email already exists." });
    if (await Customer.findOne({ phone }))
      return res
        .status(400)
        .json({ message: "Customer with this phone number already exists." });
    const savedCustomer = await new Customer({
      name,
      phone,
      email,
      tier,
      status: status.toLowerCase(),
    }).save();
    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, tier, status } = req.body;
    if (!isValidCustomerId(id))
      return res.status(400).json({ message: "Invalid customer id." });
    if (!name || !phone || !email || !tier || !isValidStatus(status)) {
      return res
        .status(400)
        .json({
          message: "Name, phone, email, tier, and a valid status are required.",
        });
    }
    if (await Customer.findOne({ email, _id: { $ne: id } }))
      return res
        .status(400)
        .json({ message: "Customer email must be unique." });
    if (await Customer.findOne({ phone, _id: { $ne: id } }))
      return res
        .status(400)
        .json({ message: "Customer phone number must be unique." });
    const customer = await Customer.findByIdAndUpdate(
      id,
      { name, phone, email, tier, status: status.toLowerCase() },
      { new: true, runValidators: true },
    );
    if (!customer)
      return res.status(404).json({ message: "Customer not found." });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchCustomers = async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword)
      return res
        .status(400)
        .json({ message: "Query parameter 'keyword' is required." });
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const customers = await Customer.find({
      $or: [
        { name: { $regex: escapedKeyword, $options: "i" } },
        { phone: { $regex: escapedKeyword, $options: "i" } },
        { email: { $regex: escapedKeyword, $options: "i" } },
      ],
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMemberPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, type } = req.body;
    if (!isValidCustomerId(id))
      return res.status(400).json({ message: "Invalid customer id." });
    if (
      !Number.isFinite(points) ||
      points <= 0 ||
      !["add", "subtract"].includes(type)
    ) {
      return res
        .status(400)
        .json({
          message:
            "'points' must be a positive number and type must be 'add' or 'subtract'.",
        });
    }
    const filter =
      type === "subtract"
        ? { _id: id, memberPoint: { $gte: points } }
        : { _id: id };
    const customer = await Customer.findOneAndUpdate(
      filter,
      { $inc: { memberPoint: type === "add" ? points : -points } },
      { new: true, runValidators: true },
    );
    if (!customer) {
      const exists = await Customer.exists({ _id: id });
      return res
        .status(exists ? 400 : 404)
        .json({
          message: exists
            ? "Insufficient member points."
            : "Customer not found.",
        });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerReservations = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidCustomerId(id)) {
      return res.status(400).json({ message: "Invalid customer id." });
    }

    const customer = await Customer.exists({ _id: id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    const reservations = await Reservation.find({ customerId: id })
      .populate("tableId", "tableNumber area capacity")
      .sort({ reservationDate: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidCustomerId(id)) {
      return res.status(400).json({ message: "Invalid customer id." });
    }
    const [hasOrders, hasReservations] = await Promise.all([
      Order.exists({ customerId: id }),
      Reservation.exists({ customerId: id }),
    ]);
    if (hasOrders || hasReservations) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this customer still has orders or reservations recorded against them." });
    }
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ message: "Customer deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchCustomers,
  updateMemberPoint,
  getCustomerReservations,
};
