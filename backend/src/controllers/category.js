const Category = require("../models/category");
const Product = require("../models/product");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategoryByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const categories = await Category.find({
      status: { $regex: status, $options: "i" },
    });
    if (categories.length === 0) {
      return res
        .status(404)
        .json({ message: "No categories found with the given status." });
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !description || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!["active", "inactive"].includes(status.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Status must be either 'active' or 'inactive'." });
    }
    if (await Category.findOne({ name })) {
      return res.status(400).json({ message: "Category name must be unique." });
    }
    const newCategory = new Category({ name, description, status });
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (await Product.exists({ categoryId: id })) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this category still has products assigned to it." });
    }
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found." });
    }
    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    //check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }
    if (await Category.findOne({ name, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Category name must be unique." });
    }
    if (!["active", "inactive"].includes(status.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Status must be either 'active' or 'inactive'." });
    }
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, status },
      { new: true },
    );
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCategories,
  getCategoryByStatus,
  addCategory,
  deleteCategory,
  updateCategory,
};
