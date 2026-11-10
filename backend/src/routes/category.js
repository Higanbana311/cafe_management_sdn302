const express = require("express");
const categoryRouter = express.Router();
const { getAllCategories, getCategoryByStatus, addCategory, deleteCategory, updateCategory } = require("../controllers/category.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER } = require("../config/roles.js");

categoryRouter.use(verifyToken);

categoryRouter.get("/", getAllCategories);
categoryRouter.get("/status/:status", getCategoryByStatus);
categoryRouter.post("/", requireRole(MANAGER), addCategory);
categoryRouter.put("/:id", requireRole(MANAGER), updateCategory);
categoryRouter.delete("/:id", requireRole(MANAGER), deleteCategory);
module.exports = categoryRouter;
