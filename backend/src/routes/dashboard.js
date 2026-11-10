const express = require("express");
const dashboardRouter = express.Router();
const { getSummary, getRevenue, getTopProducts, getProfitLoss } = require("../controllers/dashboard.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, ALL_STAFF } = require("../config/roles.js");

dashboardRouter.use(verifyToken, requireRole(...ALL_STAFF));

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/revenue", requireRole(MANAGER), getRevenue);
dashboardRouter.get("/top-products", requireRole(MANAGER), getTopProducts);
dashboardRouter.get("/profit-loss", requireRole(MANAGER), getProfitLoss);

module.exports = dashboardRouter;
