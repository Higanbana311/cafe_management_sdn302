export const MANAGER = "Manager";
export const CASHIER = "Cashier";
export const BARISTA = "Barista";
export const WAITER = "Waiter";

const FRONT_OF_HOUSE = [MANAGER, CASHIER, WAITER];
const KITCHEN = [MANAGER, BARISTA];
const ALL_STAFF = [MANAGER, CASHIER, BARISTA, WAITER];

// Mirrors the backend's route-level role checks (see backend/src/config/roles.js
// and the requireRole(...) calls in each routes/*.js file) so the UI only shows
// actions a role can actually perform against the API.
const MODULE_PERMISSIONS = {
  dashboard: { view: ALL_STAFF },
  // edit = full edit incl. payment/discount fields -> cashier/manager only.
  // Waiters can still create an order and move it through status, just not
  // reconcile payment or re-touch it afterwards.
  orders: { view: ALL_STAFF, create: FRONT_OF_HOUSE, edit: [MANAGER, CASHIER], delete: [MANAGER], status: ALL_STAFF },
  tables: { view: ALL_STAFF, create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
  // Delete is Manager-only, same as orders; front-of-house cancels via status instead.
  reservations: { view: FRONT_OF_HOUSE, create: FRONT_OF_HOUSE, edit: FRONT_OF_HOUSE, delete: [MANAGER] },
  // toggleAvailability lets kitchen staff mark a product sold out without full edit rights.
  products: { view: ALL_STAFF, create: [MANAGER], edit: [MANAGER], delete: [MANAGER], toggleAvailability: KITCHEN },
  categories: { view: [MANAGER], create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
  customers: { view: FRONT_OF_HOUSE, create: FRONT_OF_HOUSE, edit: FRONT_OF_HOUSE, delete: [MANAGER] },
  employees: { view: [MANAGER], create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
  // Barista handles day-to-day stock, but deleting an ingredient record outright
  // (which could orphan references in product recipes / purchase orders) is Manager-only.
  ingredients: { view: KITCHEN, create: KITCHEN, edit: KITCHEN, delete: [MANAGER] },
  suppliers: { view: [MANAGER], create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
  // Full purchase-order history is manager-only; create is also open to kitchen
  // staff so a "stock in" from the ingredients page can log a real cost record.
  purchaseOrders: { view: [MANAGER], create: KITCHEN, edit: [MANAGER], delete: [MANAGER] },
  expenses: { view: [MANAGER], create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
  // Front-of-house looks codes up while building an order; only managers manage them.
  promotions: { view: FRONT_OF_HOUSE, create: [MANAGER], edit: [MANAGER], delete: [MANAGER] },
};

export const canView = (role, module) => MODULE_PERMISSIONS[module]?.view.includes(role) ?? false;
export const can = (role, module, action) => MODULE_PERMISSIONS[module]?.[action]?.includes(role) ?? false;
