const Order = require("../models/order");
const Customer = require("../models/customer");
const Product = require("../models/product");
const Ingredient = require("../models/ingredient");
const Reservation = require("../models/reservation");
const Table = require("../models/table");
const Expense = require("../models/expense");
const PurchaseOrder = require("../models/purchaseOrder");

// UTC-based on purpose: $dateToString groups in UTC by default, so the day
// boundaries here must match that or "today" silently falls off the chart.
const startOfDay = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const getSummary = async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [todayAgg, todayOrderCount, totalCustomers, totalProducts, lowStockCount, pendingReservations, occupiedTables, totalTables] =
      await Promise.all([
        Order.aggregate([
          { $match: { orderDate: { $gte: todayStart, $lt: tomorrowStart }, orderStatus: { $ne: "Cancelled" } } },
          { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
        ]),
        Order.countDocuments({ orderDate: { $gte: todayStart, $lt: tomorrowStart } }),
        Customer.countDocuments(),
        Product.countDocuments(),
        Ingredient.countDocuments({ $expr: { $lte: ["$stock", "$minStock"] } }),
        Reservation.countDocuments({ status: "Confirmed" }),
        Table.countDocuments({ status: "Occupied" }),
        Table.countDocuments(),
      ]);

    res.json({
      todayRevenue: todayAgg[0]?.revenue || 0,
      todayOrderCount,
      totalCustomers,
      totalProducts,
      lowStockCount,
      pendingReservations,
      occupiedTables,
      totalTables,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRevenue = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const start = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

    const rows = await Order.aggregate([
      { $match: { orderDate: { $gte: start }, orderStatus: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
          revenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDate = new Map(rows.map((r) => [r._id, r]));
    const result = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const row = byDate.get(key);
      result.push({ date: key, revenue: row?.revenue || 0, orderCount: row?.orderCount || 0 });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);
    const result = await Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: limit },
    ]);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sumByDay = async (Model, dateField, amountField, match, start) => {
  const rows = await Model.aggregate([
    { $match: { ...match, [dateField]: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } }, total: { $sum: `$${amountField}` } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.total]));
};

const getProfitLoss = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const start = startOfDay(new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000));

    const [revenueByDay, expenseByDay, purchaseByDay] = await Promise.all([
      sumByDay(Order, "orderDate", "totalAmount", { orderStatus: { $ne: "Cancelled" } }, start),
      sumByDay(Expense, "expenseDate", "amount", {}, start),
      sumByDay(PurchaseOrder, "purchaseDate", "totalAmount", {}, start),
    ]);

    const daily = [];
    let revenue = 0;
    let expenses = 0;
    let purchaseCost = 0;
    for (let i = 0; i < days; i += 1) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = revenueByDay.get(key) || 0;
      const dayExpense = expenseByDay.get(key) || 0;
      const dayPurchase = purchaseByDay.get(key) || 0;
      revenue += dayRevenue;
      expenses += dayExpense;
      purchaseCost += dayPurchase;
      daily.push({
        date: key,
        revenue: dayRevenue,
        costs: dayExpense + dayPurchase,
        profit: dayRevenue - dayExpense - dayPurchase,
      });
    }

    res.json({
      days,
      revenue,
      expenses,
      purchaseCost,
      profit: revenue - expenses - purchaseCost,
      daily,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary, getRevenue, getTopProducts, getProfitLoss };
