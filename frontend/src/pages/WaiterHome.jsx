import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http";

const statusClass = {
  Available: "badge badge-success",
  Occupied: "badge badge-danger",
  Reserved: "badge badge-warning",
};

const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

const WaiterHome = () => {
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [t, r] = await Promise.all([http.get("/tables"), http.get("/reservations")]);
        setTables(t);
        setReservations(r.filter((res) => res.status === "Confirmed" && isToday(res.reservationDate)));
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ca làm việc - Phục vụ</h2>
        <Link to="/reservations" className="btn btn-primary">
          + Đặt bàn mới
        </Link>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="panel" style={{ marginBottom: 18 }}>
        <h3>Sơ đồ bàn</h3>
        <div className="table-grid">
          {tables.map((t) => (
            <div className="table-card" key={t._id}>
              <strong>Bàn {t.tableNumber}</strong>
              <span>{t.area}</span>
              <span className={statusClass[t.status] || "badge"}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Đặt bàn hôm nay</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đặt bàn</th>
              <th>Giờ</th>
              <th>Số khách</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => (
              <tr key={r._id}>
                <td>{r.reservationCode}</td>
                <td>{new Date(r.reservationDate).toLocaleTimeString("vi-VN")}</td>
                <td>{r.guestCount}</td>
                <td>{r.note}</td>
              </tr>
            ))}
            {reservations.length === 0 && (
              <tr>
                <td colSpan={4}>Không có đặt bàn nào hôm nay.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WaiterHome;
