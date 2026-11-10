import { useEffect, useState } from "react";
import { http } from "../api/http";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, t, pl] = await Promise.all([
          http.get("/dashboard/summary"),
          http.get("/dashboard/revenue?days=7"),
          http.get("/dashboard/top-products?limit=5"),
          http.get("/dashboard/profit-loss?days=14"),
        ]);
        setSummary(s);
        setRevenue(r);
        setTopProducts(t);
        setProfitLoss(pl);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  const maxRevenue = Math.max(1, ...revenue.map((r) => r.revenue));
  const maxDaily = Math.max(1, ...(profitLoss?.daily.map((d) => Math.max(d.revenue, d.costs)) || [1]));

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tổng quan</h2>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Doanh thu hôm nay</span>
          <span className="stat-value">{formatVND(summary?.todayRevenue)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đơn hàng hôm nay</span>
          <span className="stat-value">{summary?.todayOrderCount ?? "-"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Bàn đang sử dụng</span>
          <span className="stat-value">
            {summary?.occupiedTables ?? "-"}/{summary?.totalTables ?? "-"}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Khách hàng</span>
          <span className="stat-value">{summary?.totalCustomers ?? "-"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sản phẩm</span>
          <span className="stat-value">{summary?.totalProducts ?? "-"}</span>
        </div>
        <div className="stat-card stat-card-warning">
          <span className="stat-label">Nguyên liệu sắp hết</span>
          <span className="stat-value">{summary?.lowStockCount ?? "-"}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Đặt bàn đang chờ</span>
          <span className="stat-value">{summary?.pendingReservations ?? "-"}</span>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>Lợi nhuận {profitLoss?.days ?? 14} ngày gần nhất</h3>
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <span className="stat-label">Doanh thu</span>
            <span className="stat-value">{formatVND(profitLoss?.revenue)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Chi phí vận hành</span>
            <span className="stat-value">{formatVND(profitLoss?.expenses)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tiền nhập hàng</span>
            <span className="stat-value">{formatVND(profitLoss?.purchaseCost)}</span>
          </div>
          <div className={"stat-card" + (profitLoss && profitLoss.profit < 0 ? " stat-card-warning" : "")}>
            <span className="stat-label">Lợi nhuận</span>
            <span className="stat-value">{formatVND(profitLoss?.profit)}</span>
          </div>
        </div>
        <div className="bar-chart bar-chart-dual">
          {(profitLoss?.daily || []).map((d) => (
            <div className="bar-chart-col" key={d.date}>
              <div className="bar-chart-pair">
                <div
                  className="bar-chart-bar bar-chart-bar-revenue"
                  style={{ height: `${(d.revenue / maxDaily) * 100}%` }}
                  title={`Doanh thu: ${formatVND(d.revenue)}`}
                />
                <div
                  className="bar-chart-bar bar-chart-bar-cost"
                  style={{ height: `${(d.costs / maxDaily) * 100}%` }}
                  title={`Chi phí: ${formatVND(d.costs)}`}
                />
              </div>
              <span className="bar-chart-label">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="chart-legend">
          <span>
            <i className="legend-dot legend-dot-revenue" /> Doanh thu
          </span>
          <span>
            <i className="legend-dot legend-dot-cost" /> Chi phí
          </span>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <h3>Doanh thu 7 ngày gần nhất</h3>
          <div className="bar-chart">
            {revenue.map((r) => (
              <div className="bar-chart-col" key={r.date}>
                <div className="bar-chart-bar" style={{ height: `${(r.revenue / maxRevenue) * 100}%` }} title={formatVND(r.revenue)} />
                <span className="bar-chart-label">{r.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h3>Sản phẩm bán chạy</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SL bán</th>
                <th>Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p._id}>
                  <td>{p.productName}</td>
                  <td>{p.quantitySold}</td>
                  <td>{formatVND(p.revenue)}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan={3}>Chưa có dữ liệu.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
