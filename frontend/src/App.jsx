import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ModuleRoute from "./components/ModuleRoute";
import Login from "./pages/Login";
import RoleHome from "./pages/RoleHome";
import CategoriesPage from "./pages/CategoriesPage";
import CustomersPage from "./pages/CustomersPage";
import PromotionsPage from "./pages/PromotionsPage";
import SuppliersPage from "./pages/SuppliersPage";
import TablesPage from "./pages/TablesPage";
import ReservationsPage from "./pages/ReservationsPage";
import IngredientsPage from "./pages/IngredientsPage";
import ExpensesPage from "./pages/ExpensesPage";
import EmployeesPage from "./pages/EmployeesPage";
import ProductsPage from "./pages/ProductsPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import OrdersPage from "./pages/OrdersPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleHome />} />
        <Route
          path="orders"
          element={
            <ModuleRoute module="orders">
              <OrdersPage />
            </ModuleRoute>
          }
        />
        <Route
          path="tables"
          element={
            <ModuleRoute module="tables">
              <TablesPage />
            </ModuleRoute>
          }
        />
        <Route
          path="reservations"
          element={
            <ModuleRoute module="reservations">
              <ReservationsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="products"
          element={
            <ModuleRoute module="products">
              <ProductsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="categories"
          element={
            <ModuleRoute module="categories">
              <CategoriesPage />
            </ModuleRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ModuleRoute module="customers">
              <CustomersPage />
            </ModuleRoute>
          }
        />
        <Route
          path="promotions"
          element={
            <ModuleRoute module="promotions">
              <PromotionsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ModuleRoute module="employees">
              <EmployeesPage />
            </ModuleRoute>
          }
        />
        <Route
          path="ingredients"
          element={
            <ModuleRoute module="ingredients">
              <IngredientsPage />
            </ModuleRoute>
          }
        />
        <Route
          path="suppliers"
          element={
            <ModuleRoute module="suppliers">
              <SuppliersPage />
            </ModuleRoute>
          }
        />
        <Route
          path="purchase-orders"
          element={
            <ModuleRoute module="purchaseOrders">
              <PurchaseOrdersPage />
            </ModuleRoute>
          }
        />
        <Route
          path="expenses"
          element={
            <ModuleRoute module="expenses">
              <ExpensesPage />
            </ModuleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
