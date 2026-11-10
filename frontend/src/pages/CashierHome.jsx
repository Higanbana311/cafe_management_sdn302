import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";
const ACTIVE_STATUSES = ["Pending", "Preparing", "Serving"];

const CashierHome = () => {
  const [summary, setSummary] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, orders] = await Promise.all([http.get("/dashboard/summary"), http.get("/orders")]);
        setSummary(s);
        setActiveOrders(orders.filter((o) => ACTIVE_STATUSES.includes(o.orderStatus)));
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ca làm việc - Thu ngân</h2>
        <Link to="/orders" className="btn btn-primary">
          + Tạo đơn hàng
        </Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Đơn hàng hôm nay</span>
          <span className="stat-value">{summary?.todayOrderCount ?? "-"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đơn đang xử lý</span>
          <span className="stat-value">{activeOrders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Bàn đang sử dụng</span>
          <span className="stat-value">
            {summary?.occupiedTables ?? "-"}/{summary?.totalTables ?? "-"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đặt bàn đang chờ</span>
          <span className="stat-value">{summary?.pendingReservations ?? "-"}</span>
        </div>
      </div>

      <div className="panel">
        <h3>Đơn hàng cần xử lý</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {activeOrders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderCode}</td>
                <td>{o.orderType}</td>
                <td>{o.orderStatus}</td>
                <td>{o.payment?.status}</td>
                <td>{formatVND(o.totalAmount)}</td>
              </tr>
            ))}
            {activeOrders.length === 0 && (
              <tr>
                <td colSpan={5}>Không có đơn hàng đang xử lý.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CashierHome;
