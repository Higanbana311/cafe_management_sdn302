const mongoose = require("mongoose");
const Product = require("../models/product");
const Category = require("../models/category");
const Ingredient = require("../models/ingredient");

const isValidId = (id) => mongoose.isValidObjectId(id);

const validateRecipe = async (recipe) => {
  if (!recipe || !Array.isArray(recipe.ingredients)) {
    return "recipe.ingredients must be an array.";
  }
  for (const item of recipe.ingredients) {
    if (!isValidId(item.ingredientId) || !item.quantity || !item.unit) {
      return "Each recipe ingredient requires a valid ingredientId, quantity and unit.";
    }
    if (!(await Ingredient.exists({ _id: item.ingredientId }))) {
      return `Ingredient ${item.ingredientId} does not exist.`;
    }
  }
  return null;
};

const getAllProducts = async (req, res) => {
  try {
    res.json(await Product.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!isValidId(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId." });
    }
    res.json(await Product.find({ categoryId }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, categoryId, price, unit, isAvailable, recipe } = req.body;
    if (!name || !categoryId || price === undefined || !unit) {
      return res.status(400).json({ message: "name, categoryId, price and unit are required." });
    }
    if (!isValidId(categoryId) || !(await Category.exists({ _id: categoryId }))) {
      return res.status(400).json({ message: "Invalid categoryId." });
    }
    const recipeError = await validateRecipe(recipe);
    if (recipeError) {
      return res.status(400).json({ message: recipeError });
    }
    const savedProduct = await new Product({
      name,
      categoryId,
      price,
      unit,
      isAvailable: isAvailable !== false,
      recipe,
    }).save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, price, unit, isAvailable, recipe } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    if (!name || !categoryId || price === undefined || !unit) {
      return res.status(400).json({ message: "name, categoryId, price and unit are required." });
    }
    if (!isValidId(categoryId) || !(await Category.exists({ _id: categoryId }))) {
      return res.status(400).json({ message: "Invalid categoryId." });
    }
    const recipeError = await validateRecipe(recipe);
    if (recipeError) {
      return res.status(400).json({ message: recipeError });
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { name, categoryId, price, unit, isAvailable: isAvailable !== false, recipe },
      { new: true, runValidators: true },
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be a boolean." });
    }
    const product = await Product.findByIdAndUpdate(id, { isAvailable }, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid product id." });
    }
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  toggleAvailability,
  deleteProduct,
};
