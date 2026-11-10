import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import { ORDER_STATUS_OPTIONS } from "../constants/orderStatus";

const QUEUE_STATUSES = ["Pending", "Preparing", "Serving"];

const BaristaHome = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState("");

  const tableLabel = (id) => {
    const t = tables.find((x) => x._id === id);
    return t ? `Bàn ${t.tableNumber} (${t.area})` : id;
  };

  const load = async () => {
    setError("");
    try {
      const [o, t, low] = await Promise.all([
        http.get("/orders"),
        http.get("/tables"),
        http.get("/ingredients/low-stock"),
      ]);
      setOrders(o.filter((order) => QUEUE_STATUSES.includes(order.orderStatus)));
      setTables(t);
      setLowStock(low);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (order, newStatus) => {
    try {
      await http.patch(`/orders/${order._id}/status`, { orderStatus: newStatus });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Khu pha chế</h2>
        <Link to="/ingredients" className="btn btn-secondary">
          Quản lý kho nguyên liệu
        </Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      {lowStock.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: 18 }}>
          ⚠️ {lowStock.length} nguyên liệu sắp hết: {lowStock.map((i) => i.name).join(", ")}
        </div>
      )}

      <div className="panel">
        <h3>Hàng chờ chế biến ({orders.length})</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Bàn</th>
              <th>Món</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td>{o.orderCode}</td>
                <td>{tableLabel(o.tableId)}</td>
                <td>{o.items.map((it) => `${it.productName} x${it.quantity}`).join(", ")}</td>
                <td>
                  <select className="status-select" value={o.orderStatus} onChange={(e) => updateStatus(o, e.target.value)}>
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4}>Không có đơn nào cần chế biến.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BaristaHome;
