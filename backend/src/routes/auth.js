const express = require("express");
const authRouter = express.Router();
const { register, login, getMe } = require("../controllers/auth.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER } = require("../config/roles.js");

// Only managers onboard new staff accounts; anyone can log in.
authRouter.post("/register", verifyToken, requireRole(MANAGER), register);
authRouter.post("/login", login);
authRouter.get("/me", verifyToken, getMe);

module.exports = authRouter;
