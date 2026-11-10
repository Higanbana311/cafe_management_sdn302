const mongoose = require("mongoose");
const Reservation = require("../models/reservation");
const Customer = require("../models/customer");
const Table = require("../models/table");

const isValidId = (id) => mongoose.isValidObjectId(id);

// A confirmed reservation marks its table "Reserved" so the floor plan reflects
// it; both transitions are conditional so they never clobber a table that's
// actually "Occupied" by an active order.
const reserveTable = async (tableId) => {
  await Table.findOneAndUpdate({ _id: tableId, status: "Available" }, { status: "Reserved" });
};
const releaseTable = async (tableId) => {
  await Table.findOneAndUpdate({ _id: tableId, status: "Reserved" }, { status: "Available" });
};

const getAllReservations = async (req, res) => {
  try {
    res.json(
      await Reservation.find()
        .populate("customerId", "name phone email")
        .populate("tableId", "tableNumber area capacity")
        .sort({ reservationDate: -1 }),
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReservationById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid reservation id." });
    }
    const reservation = await Reservation.findById(req.params.id)
      .populate("customerId", "name phone email")
      .populate("tableId", "tableNumber area capacity");
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found." });
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReservation = async (req, res) => {
  try {
    const { reservationCode, customerId, tableId, reservationDate, guestCount, note, status } =
      req.body;
    if (!reservationCode || !customerId || !tableId || !reservationDate || !guestCount || !status) {
      return res.status(400).json({
        message: "reservationCode, customerId, tableId, reservationDate, guestCount and status are required.",
      });
    }
    if (!isValidId(customerId) || !(await Customer.exists({ _id: customerId }))) {
      return res.status(400).json({ message: "Invalid customerId." });
    }
    if (!isValidId(tableId) || !(await Table.exists({ _id: tableId }))) {
      return res.status(400).json({ message: "Invalid tableId." });
    }
    if (await Reservation.findOne({ reservationCode })) {
      return res.status(400).json({ message: "Reservation code must be unique." });
    }
    const savedReservation = await new Reservation({
      reservationCode,
      customerId,
      tableId,
      reservationDate,
      guestCount,
      note: note || "",
      status,
    }).save();

    if (status === "Confirmed") {
      await reserveTable(tableId);
    }

    res.status(201).json(savedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reservationCode, customerId, tableId, reservationDate, guestCount, note, status } =
      req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid reservation id." });
    }
    const existing = await Reservation.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Reservation not found." });
    }
    if (!reservationCode || !customerId || !tableId || !reservationDate || !guestCount || !status) {
      return res.status(400).json({
        message: "reservationCode, customerId, tableId, reservationDate, guestCount and status are required.",
      });
    }
    if (!isValidId(customerId) || !(await Customer.exists({ _id: customerId }))) {
      return res.status(400).json({ message: "Invalid customerId." });
    }
    if (!isValidId(tableId) || !(await Table.exists({ _id: tableId }))) {
      return res.status(400).json({ message: "Invalid tableId." });
    }
    if (await Reservation.findOne({ reservationCode, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Reservation code must be unique." });
    }
    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { reservationCode, customerId, tableId, reservationDate, guestCount, note: note || "", status },
      { new: true, runValidators: true },
    );

    if (existing.status === "Confirmed" && (status !== "Confirmed" || String(existing.tableId) !== String(tableId))) {
      await releaseTable(existing.tableId);
    }
    if (status === "Confirmed") {
      await reserveTable(tableId);
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid reservation id." });
    }
    const deletedReservation = await Reservation.findByIdAndDelete(id);
    if (!deletedReservation) {
      return res.status(404).json({ message: "Reservation not found." });
    }
    if (deletedReservation.status === "Confirmed") {
      await releaseTable(deletedReservation.tableId);
    }
    res.json({ message: "Reservation deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
};
