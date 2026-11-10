const mongoose = require("mongoose");
const Table = require("../models/table");
const Order = require("../models/order");
const Reservation = require("../models/reservation");

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllTables = async (req, res) => {
  try {
    res.json(await Table.find().sort({ tableNumber: 1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTableById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid table id." });
    }
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTablesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tables = await Table.find({ status: { $regex: status, $options: "i" } });
    if (tables.length === 0) {
      return res.status(404).json({ message: "No tables found with the given status." });
    }
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTable = async (req, res) => {
  try {
    const { tableNumber, area, capacity, status } = req.body;
    if (!tableNumber || !area || !capacity || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (await Table.findOne({ tableNumber })) {
      return res.status(400).json({ message: "Table number must be unique." });
    }
    const savedTable = await new Table({ tableNumber, area, capacity, status }).save();
    res.status(201).json(savedTable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, area, capacity, status } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid table id." });
    }
    if (!tableNumber || !area || !capacity || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (await Table.findOne({ tableNumber, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Table number must be unique." });
    }
    const table = await Table.findByIdAndUpdate(
      id,
      { tableNumber, area, capacity, status },
      { new: true, runValidators: true },
    );
    if (!table) {
      return res.status(404).json({ message: "Table not found." });
    }
    res.json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid table id." });
    }
    const [hasOrders, hasReservations] = await Promise.all([
      Order.exists({ tableId: id }),
      Reservation.exists({ tableId: id }),
    ]);
    if (hasOrders || hasReservations) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this table still has orders or reservations recorded against it." });
    }
    const deletedTable = await Table.findByIdAndDelete(id);
    if (!deletedTable) {
      return res.status(404).json({ message: "Table not found." });
    }
    res.json({ message: "Table deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllTables,
  getTableById,
  getTablesByStatus,
  createTable,
  updateTable,
  deleteTable,
};
