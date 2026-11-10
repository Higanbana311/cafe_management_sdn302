import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canView } from "../auth/permissions";

const NAV_SECTIONS = [
  {
    label: "Vận hành",
    items: [
      { to: "/", label: "Tổng quan", icon: "📊", end: true, module: "dashboard" },
      { to: "/orders", label: "Đơn hàng", icon: "🧾", module: "orders" },
      { to: "/tables", label: "Bàn", icon: "🪑", module: "tables" },
      { to: "/reservations", label: "Đặt bàn", icon: "📅", module: "reservations" },
    ],
  },
  {
    label: "Sản phẩm & Kho",
    items: [
      { to: "/products", label: "Sản phẩm", icon: "☕", module: "products" },
      { to: "/categories", label: "Danh mục", icon: "🗂️", module: "categories" },
      { to: "/ingredients", label: "Nguyên liệu", icon: "🌿", module: "ingredients" },
      { to: "/suppliers", label: "Nhà cung cấp", icon: "🚚", module: "suppliers" },
      { to: "/purchase-orders", label: "Đơn nhập hàng", icon: "📦", module: "purchaseOrders" },
    ],
  },
  {
    label: "Khách hàng",
    items: [
      { to: "/customers", label: "Khách hàng", icon: "👤", module: "customers" },
      { to: "/promotions", label: "Khuyến mãi", icon: "🏷️", module: "promotions" },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { to: "/employees", label: "Nhân viên", icon: "🧑‍💼", module: "employees" },
      { to: "/expenses", label: "Chi phí", icon: "💸", module: "expenses" },
    ],
  },
];

const Layout = () => {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canView(employee?.role, item.module)),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">☕</span> Cafe Manager
        </div>
        <nav className="sidebar-nav">
          {visibleSections.map((section) => (
            <div className="sidebar-section" key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div />
          <div className="topbar-user">
            <div className="user-avatar">{employee?.name?.charAt(0)?.toUpperCase() || "?"}</div>
            <div className="user-info">
              <strong>{employee?.name}</strong>
              <span>{employee?.role}</span>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
