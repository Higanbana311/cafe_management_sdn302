const mongoose = require("mongoose");
const PurchaseOrder = require("../models/purchaseOrder");
const Supplier = require("../models/supplier");
const Employee = require("../models/employee");
const Ingredient = require("../models/ingredient");

const isValidId = (id) => mongoose.isValidObjectId(id);

// Stock only moves once a purchase order is marked "Received" — a Pending
// or Cancelled order shouldn't have already put goods on the shelf.
// sign is +1 to add stock back (received) or -1 to reverse it (un-received).
const applyStockForItems = async (items, sign) => {
  if (!items || items.length === 0) return;
  const ops = items.map((item) => ({
    updateOne: {
      filter: { _id: item.ingredientId },
      update: [
        {
          $set: {
            stock: { $round: [{ $add: ["$stock", sign * item.quantity] }, 2] },
            lastUpdated: new Date(),
          },
        },
      ],
    },
  }));
  await Ingredient.bulkWrite(ops);
};

const validateItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "items must be a non-empty array.";
  }
  for (const item of items) {
    if (
      !isValidId(item.ingredientId) ||
      !item.name ||
      !item.quantity ||
      !item.unit ||
      item.unitPrice === undefined ||
      item.subtotal === undefined
    ) {
      return "Each item requires a valid ingredientId, name, quantity, unit, unitPrice and subtotal.";
    }
    if (!(await Ingredient.exists({ _id: item.ingredientId }))) {
      return `Ingredient ${item.ingredientId} does not exist.`;
    }
  }
  return null;
};

const getAllPurchaseOrders = async (req, res) => {
  try {
    res.json(await PurchaseOrder.find().sort({ purchaseDate: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid purchase order id." });
    }
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found." });
    }
    res.json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const {
      purchaseCode,
      supplierId,
      employeeId,
      purchaseDate,
      items,
      totalAmount,
      paymentStatus,
      status,
    } = req.body;
    if (!purchaseCode || !supplierId || !employeeId || totalAmount === undefined || !paymentStatus || !status) {
      return res.status(400).json({
        message: "purchaseCode, supplierId, employeeId, totalAmount, paymentStatus and status are required.",
      });
    }
    if (!isValidId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) {
      return res.status(400).json({ message: "Invalid supplierId." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    const itemsError = await validateItems(items);
    if (itemsError) {
      return res.status(400).json({ message: itemsError });
    }
    if (await PurchaseOrder.findOne({ purchaseCode })) {
      return res.status(400).json({ message: "Purchase code must be unique." });
    }
    const savedPurchaseOrder = await new PurchaseOrder({
      purchaseCode,
      supplierId,
      employeeId,
      purchaseDate: purchaseDate || new Date(),
      items,
      totalAmount,
      paymentStatus,
      status,
    }).save();
    if (status === "Received") {
      await applyStockForItems(items, 1);
    }
    res.status(201).json(savedPurchaseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      purchaseCode,
      supplierId,
      employeeId,
      purchaseDate,
      items,
      totalAmount,
      paymentStatus,
      status,
    } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid purchase order id." });
    }
    const existing = await PurchaseOrder.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Purchase order not found." });
    }
    if (!purchaseCode || !supplierId || !employeeId || totalAmount === undefined || !paymentStatus || !status) {
      return res.status(400).json({
        message: "purchaseCode, supplierId, employeeId, totalAmount, paymentStatus and status are required.",
      });
    }
    if (!isValidId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) {
      return res.status(400).json({ message: "Invalid supplierId." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    const itemsError = await validateItems(items);
    if (itemsError) {
      return res.status(400).json({ message: itemsError });
    }
    if (await PurchaseOrder.findOne({ purchaseCode, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Purchase code must be unique." });
    }
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { purchaseCode, supplierId, employeeId, purchaseDate, items, totalAmount, paymentStatus, status },
      { new: true, runValidators: true },
    );
    // Reverse whatever stock the previous "Received" state put on the shelf,
    // then re-apply it if the (possibly edited) order is still/now Received —
    // this also nets out correctly when only quantities changed.
    if (existing.status === "Received") {
      await applyStockForItems(existing.items, -1);
    }
    if (status === "Received") {
      await applyStockForItems(items, 1);
    }
    res.json(purchaseOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid purchase order id." });
    }
    const deletedPurchaseOrder = await PurchaseOrder.findByIdAndDelete(id);
    if (!deletedPurchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found." });
    }
    if (deletedPurchaseOrder.status === "Received") {
      await applyStockForItems(deletedPurchaseOrder.items, -1);
    }
    res.json({ message: "Purchase order deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
};
