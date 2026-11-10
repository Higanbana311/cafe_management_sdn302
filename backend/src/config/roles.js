const MANAGER = "Manager";
const CASHIER = "Cashier";
const BARISTA = "Barista";
const WAITER = "Waiter";

module.exports = {
  MANAGER,
  CASHIER,
  BARISTA,
  WAITER,
  FRONT_OF_HOUSE: [MANAGER, CASHIER, WAITER],
  KITCHEN: [MANAGER, BARISTA],
  ALL_STAFF: [MANAGER, CASHIER, BARISTA, WAITER],
};
