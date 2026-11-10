const express = require("express");
const reservationRouter = express.Router();
const {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} = require("../controllers/reservation.js");
const { verifyToken, requireRole } = require("../middleware/auth.js");
const { MANAGER, FRONT_OF_HOUSE } = require("../config/roles.js");

reservationRouter.use(verifyToken, requireRole(...FRONT_OF_HOUSE));

reservationRouter.get("/", getAllReservations);
reservationRouter.get("/:id", getReservationById);
reservationRouter.post("/", createReservation);
reservationRouter.put("/:id", updateReservation);
// Cancel via status instead of a hard delete; only a manager removes the record outright.
reservationRouter.delete("/:id", requireRole(MANAGER), deleteReservation);

module.exports = reservationRouter;
