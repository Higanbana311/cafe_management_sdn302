const mongoose = require("mongoose");
const Supplier = require("../models/supplier");
const Ingredient = require("../models/ingredient");

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllSuppliers = async (req, res) => {
  try {
    res.json(await Supplier.find());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier id." });
    }
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address, status } = req.body;
    if (!name || !phone || !email || !address || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (await Supplier.findOne({ email })) {
      return res.status(400).json({ message: "Supplier with this email already exists." });
    }
    if (await Supplier.findOne({ phone })) {
      return res.status(400).json({ message: "Supplier with this phone number already exists." });
    }
    const savedSupplier = await new Supplier({ name, phone, email, address, status }).save();
    res.status(201).json(savedSupplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, status } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid supplier id." });
    }
    if (!name || !phone || !email || !address || !status) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (await Supplier.findOne({ email, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Supplier email must be unique." });
    }
    if (await Supplier.findOne({ phone, _id: { $ne: id } })) {
      return res.status(400).json({ message: "Supplier phone number must be unique." });
    }
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { name, phone, email, address, status },
      { new: true, runValidators: true },
    );
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }
    res.json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid supplier id." });
    }
    if (await Ingredient.exists({ supplierId: id })) {
      return res
        .status(400)
        .json({ message: "Cannot delete: this supplier still has ingredients assigned to it." });
    }
    const deletedSupplier = await Supplier.findByIdAndDelete(id);
    if (!deletedSupplier) {
      return res.status(404).json({ message: "Supplier not found." });
    }
    res.json({ message: "Supplier deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
