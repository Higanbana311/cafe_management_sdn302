const mongoose = require("mongoose");
const Promotion = require("../models/promotion");

const isValidId = (id) => mongoose.isValidObjectId(id);

const getAllPromotions = async (req, res) => {
  try {
    res.json(await Promotion.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPromotionById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid promotion id." });
    }
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found." });
    }
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, startDate, endDate, isActive } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: "code, discountType and discountValue are required." });
    }
    if (!["Percentage", "Fixed"].includes(discountType)) {
      return res.status(400).json({ message: "discountType must be 'Percentage' or 'Fixed'." });
    }
    if (await Promotion.findOne({ code: code.toUpperCase() })) {
      return res.status(400).json({ message: "Promotion code must be unique." });
    }
    const savedPromotion = await new Promotion({
      code,
      description: description || "",
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive !== false,
    }).save();
    res.status(201).json(savedPromotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, discountType, discountValue, minOrderAmount, startDate, endDate, isActive } = req.body;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid promotion id." });
    }
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ message: "code, discountType and discountValue are required." });
    }
    if (!["Percentage", "Fixed"].includes(discountType)) {
      return res.status(400).json({ message: "discountType must be 'Percentage' or 'Fixed'." });
    }
    if (await Promotion.findOne({ code: code.toUpperCase(), _id: { $ne: id } })) {
      return res.status(400).json({ message: "Promotion code must be unique." });
    }
    const promotion = await Promotion.findByIdAndUpdate(
      id,
      {
        code,
        description: description || "",
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        isActive: isActive !== false,
      },
      { new: true, runValidators: true },
    );
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found." });
    }
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: "Invalid promotion id." });
    }
    const deletedPromotion = await Promotion.findByIdAndDelete(id);
    if (!deletedPromotion) {
      return res.status(404).json({ message: "Promotion not found." });
    }
    res.json({ message: "Promotion deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Looked up by front-of-house staff while building an order, to check a code
// is usable right now and compute the resulting discount for that subtotal.
const validatePromotionCode = async (req, res) => {
  try {
    const { code } = req.params;
    const orderAmount = Number(req.query.orderAmount) || 0;
    const promotion = await Promotion.findOne({ code: code.toUpperCase() });
    if (!promotion) {
      return res.status(404).json({ message: "Promotion code not found." });
    }
    if (!promotion.isActive) {
      return res.status(400).json({ message: "This promotion is no longer active." });
    }
    const now = new Date();
    if (promotion.startDate && now < promotion.startDate) {
      return res.status(400).json({ message: "This promotion has not started yet." });
    }
    if (promotion.endDate && now > promotion.endDate) {
      return res.status(400).json({ message: "This promotion has expired." });
    }
    if (orderAmount < promotion.minOrderAmount) {
      return res.status(400).json({
        message: `Order must be at least ${promotion.minOrderAmount.toLocaleString()} to use this code.`,
      });
    }
    const discountAmount =
      promotion.discountType === "Percentage"
        ? Math.round((orderAmount * promotion.discountValue) / 100)
        : Math.min(promotion.discountValue, orderAmount);
    res.json({
      promotion: {
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
      },
      discountAmount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotionCode,
};
