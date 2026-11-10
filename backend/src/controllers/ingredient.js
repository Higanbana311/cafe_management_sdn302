const mongoose = require("mongoose");
const Ingredient = require("../models/ingredient");
const Supplier = require("../models/supplier");
const Product = require("../models/product");

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllIngredients = async (req, res) => {
  try {
    res.json(await Ingredient.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLowStockIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ $expr: { $lte: ["$stock", "$minStock"] } });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getIngredientById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid ingredient id." });
    }
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found." });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createIngredient = async (req, res) => {
  try {
    const { name, category, unit, stock, minStock, supplierId } = req.body;
    if (!name || !category || !unit || stock === undefined || minStock === undefined || !supplierId) {
      return res.status(400).json({
        message: "name, category, unit, stock, minStock and supplierId are required.",
      });
    }
    if (!isValidId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) {
      return res.status(400).json({ message: "Invalid supplierId." });
    }
    const savedIngredient = await new Ingredient({
      name,
      category,
      unit,
      stock,
      minStock,
      supplierId,
      lastUpdated: new Date(),
    }).save();
    res.status(201).json(savedIngredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, stock, minStock, supplierId } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid ingredient id." });
    }
    if (!name || !category || !unit || stock === undefined || minStock === undefined || !supplierId) {
      return res.status(400).json({
        message: "name, category, unit, stock, minStock and supplierId are required.",
      });
    }
    if (!isValidId(supplierId) || !(await Supplier.exists({ _id: supplierId }))) {
      return res.status(400).json({ message: "Invalid supplierId." });
    }
    const ingredient = await Ingredient.findByIdAndUpdate(
      id,
      { name, category, unit, stock, minStock, supplierId, lastUpdated: new Date() },
      { new: true, runValidators: true },
    );
    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found." });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid ingredient id." });
    }
    if (!Number.isFinite(quantity) || quantity <= 0 || !["add", "subtract"].includes(type)) {
      return res.status(400).json({
        message: "'quantity' must be a positive number and type must be 'add' or 'subtract'.",
      });
    }
    const filter =
      type === "subtract" ? { _id: id, stock: { $gte: quantity } } : { _id: id };
    const ingredient = await Ingredient.findOneAndUpdate(
      filter,
      { $inc: { stock: type === "add" ? quantity : -quantity }, lastUpdated: new Date() },
      { new: true, runValidators: true },
    );
    if (!ingredient) {
      const exists = await Ingredient.exists({ _id: id });
      return res
        .status(exists ? 400 : 404)
        .json({ message: exists ? "Insufficient stock." : "Ingredient not found." });
    }
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid ingredient id." });
    }
    if (await Product.exists({ "recipe.ingredients.ingredientId": id })) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this ingredient is still used in a product recipe." });
    }
    const deletedIngredient = await Ingredient.findByIdAndDelete(id);
    if (!deletedIngredient) {
      return res.status(404).json({ message: "Ingredient not found." });
    }
    res.json({ message: "Ingredient deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllIngredients,
  getLowStockIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  adjustStock,
  deleteIngredient,
};
