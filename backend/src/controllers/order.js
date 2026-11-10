const mongoose = require("mongoose");
const Order = require("../models/order");
const Table = require("../models/table");
const Customer = require("../models/customer");
const Employee = require("../models/employee");
const Product = require("../models/product");
const Ingredient = require("../models/ingredient");

const isValidId = (id) => mongoose.isValidObjectId(id);

const validateItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "items must be a non-empty array.";
  }
  for (const item of items) {
    if (
      !isValidId(item.productId) ||
      !item.productName ||
      !item.quantity ||
      item.unitPrice === undefined ||
      item.subtotal === undefined
    ) {
      return "Each item requires a valid productId, productName, quantity, unitPrice and subtotal.";
    }
    const product = await Product.findById(item.productId);
    if (!product) {
      return `Product ${item.productId} does not exist.`;
    }
    if (!product.isAvailable) {
      return `Product "${product.name}" is currently marked as sold out.`;
    }
  }
  return null;
};

// Deducts ingredient stock based on each sold product's recipe. Best-effort:
// does not block order creation if an ingredient runs short, since this is
// a simple internal tool rather than a strict inventory system.
const deductIngredientsForItems = async (items) => {
  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));
  const ops = [];
  for (const item of items) {
    const product = productMap.get(String(item.productId));
    if (!product || !product.recipe) continue;
    for (const ing of product.recipe.ingredients) {
      ops.push({
        updateOne: {
          filter: { _id: ing.ingredientId },
          update: { $inc: { stock: -(ing.quantity * item.quantity) }, $set: { lastUpdated: new Date() } },
        },
      });
    }
  }
  if (ops.length > 0) {
    await Ingredient.bulkWrite(ops);
  }
};

const setTableStatus = async (tableId, status) => {
  await Table.findByIdAndUpdate(tableId, { status });
};

// 1 point per 10,000 spent; tiers are re-evaluated off the new point total
// every time points are earned.
const POINTS_PER_VND = 10000;
const TIER_THRESHOLDS = [
  { tier: "VIP", min: 600 },
  { tier: "Gold", min: 300 },
  { tier: "Silver", min: 100 },
  { tier: "Member", min: 0 },
];
const tierForPoints = (points) => TIER_THRESHOLDS.find((t) => points >= t.min).tier;

const awardLoyaltyPoints = async (customerId, totalAmount) => {
  if (!customerId) return;
  const earnedPoints = Math.floor(totalAmount / POINTS_PER_VND);
  if (earnedPoints <= 0) return;
  const customer = await Customer.findByIdAndUpdate(customerId, { $inc: { memberPoint: earnedPoints } }, { new: true });
  if (!customer) return;
  const newTier = tierForPoints(customer.memberPoint);
  if (newTier !== customer.tier) {
    await Customer.findByIdAndUpdate(customerId, { tier: newTier });
  }
};

const getAllOrders = async (req, res) => {
  try {
    res.json(await Order.find().sort({ orderDate: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Only managers/cashiers reconcile payments and apply discounts; a waiter
// placing/editing an order can't sneak in a "Paid" status or a discount.
const CAN_MANAGE_PAYMENT = ["Manager", "Cashier"];

const createOrder = async (req, res) => {
  try {
    const {
      orderCode,
      orderType,
      tableId,
      customerId,
      employeeId,
      orderDate,
      items,
      subTotal,
      promotion,
      totalAmount,
      orderStatus,
    } = req.body;
    let { discountAmount, payment } = req.body;
    if (!CAN_MANAGE_PAYMENT.includes(req.user.role)) {
      discountAmount = 0;
      payment = payment && { ...payment, status: "Unpaid", amount: 0, paidAt: null, transactionCode: null };
    }
    if (
      !orderCode ||
      !orderType ||
      !tableId ||
      !employeeId ||
      subTotal === undefined ||
      totalAmount === undefined ||
      !orderStatus ||
      !payment ||
      !payment.status
    ) {
      return res.status(400).json({
        message:
          "orderCode, orderType, tableId, employeeId, subTotal, totalAmount, orderStatus and payment.status are required.",
      });
    }
    if (!isValidId(tableId)) {
      return res.status(400).json({ message: "Invalid tableId." });
    }
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(400).json({ message: "Invalid tableId." });
    }
    if (orderType === "Dine-in" && table.status === "Occupied") {
      return res.status(400).json({ message: "This table is already occupied by another order." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    if (customerId && (!isValidId(customerId) || !(await Customer.exists({ _id: customerId })))) {
      return res.status(400).json({ message: "Invalid customerId." });
    }
    const itemsError = await validateItems(items);
    if (itemsError) {
      return res.status(400).json({ message: itemsError });
    }
    if (await Order.findOne({ orderCode })) {
      return res.status(400).json({ message: "Order code must be unique." });
    }
    const savedOrder = await new Order({
      orderCode,
      orderType,
      tableId,
      customerId: customerId || null,
      employeeId,
      orderDate: orderDate || new Date(),
      items,
      subTotal,
      promotion: promotion || null,
      discountAmount: discountAmount || 0,
      totalAmount,
      orderStatus,
      payment,
    }).save();

    await deductIngredientsForItems(items);
    if (orderType === "Dine-in" && !["Completed", "Cancelled"].includes(orderStatus)) {
      await setTableStatus(tableId, "Occupied");
    }
    if (orderStatus === "Completed") {
      await awardLoyaltyPoints(customerId, totalAmount);
    }

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      orderCode,
      orderType,
      tableId,
      customerId,
      employeeId,
      orderDate,
      items,
      subTotal,
      promotion,
      discountAmount,
      totalAmount,
      orderStatus,
      payment,
    } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const existing = await Order.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (
      !orderCode ||
      !orderType ||
      !tableId ||
      !employeeId ||
      subTotal === undefined ||
      totalAmount === undefined ||
      !orderStatus ||
      !payment ||
      !payment.status
    ) {
      return res.status(400).json({
        message:
          "orderCode, orderType, tableId, employeeId, subTotal, totalAmount, orderStatus and payment.status are required.",
      });
    }
    if (!isValidId(tableId) || !(await Table.exists({ _id: tableId }))) {
      return res.status(400).json({ message: "Invalid tableId." });
    }
    if (!isValidId(employeeId) || !(await Employee.exists({ _id: employeeId }))) {
      return res.status(400).json({ message: "Invalid employeeId." });
    }
    if (customerId && (!isValidId(customerId) || !(await Customer.exists({ _id: customerId })))) {
      return res.status(400).json({ message: "Invalid customerId." });
    }
    const itemsError = await validateItems(items);
    if (itemsError) {
      return res.status(400).json({ message: itemsError });
    }
    if (await Order.findOne({ orderCode, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Order code must be unique." });
    }
    const order = await Order.findByIdAndUpdate(
      id,
      {
        orderCode,
        orderType,
        tableId,
        customerId: customerId || null,
        employeeId,
        orderDate,
        items,
        subTotal,
        promotion: promotion || null,
        discountAmount: discountAmount || 0,
        totalAmount,
        orderStatus,
        payment,
      },
      { new: true, runValidators: true },
    );

    if (existing.orderStatus !== "Completed" && orderStatus === "Completed") {
      await awardLoyaltyPoints(customerId, totalAmount);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    if (!orderStatus) {
      return res.status(400).json({ message: "orderStatus is required." });
    }
    const existing = await Order.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Order not found." });
    }
    const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true, runValidators: true });
    if (order.orderType === "Dine-in" && ["Completed", "Cancelled"].includes(orderStatus)) {
      await setTableStatus(order.tableId, "Available");
    }
    if (existing.orderStatus !== "Completed" && orderStatus === "Completed") {
      await awardLoyaltyPoints(order.customerId, order.totalAmount);
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid order id." });
    }
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }
    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
};
