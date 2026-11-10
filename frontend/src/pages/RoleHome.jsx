import { useAuth } from "../context/AuthContext";
import { MANAGER, CASHIER, WAITER, BARISTA } from "../auth/permissions";
import Dashboard from "./Dashboard";
import CashierHome from "./CashierHome";
import WaiterHome from "./WaiterHome";
import BaristaHome from "./BaristaHome";

// Each role lands on the screen that matches its job.
const RoleHome = () => {
  const { employee } = useAuth();
  switch (employee?.role) {
    case MANAGER:
      return <Dashboard />;
    case CASHIER:
      return <CashierHome />;
    case WAITER:
      return <WaiterHome />;
    case BARISTA:
      return <BaristaHome />;
    default:
      return (
        <div className="page">
          <div className="empty-state">Vai trò của bạn chưa được cấu hình trang tổng quan. Vui lòng liên hệ quản lý.</div>
        </div>
      );
  }
};

export default RoleHome;
