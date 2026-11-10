import { useState } from "react";
import ResourcePage from "../components/ResourcePage";
import Modal from "../components/Modal";
import { http } from "../api/http";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const columns = [
  { key: "name", label: "Họ tên" },
  { key: "phone", label: "SĐT" },
  { key: "email", label: "Email" },
  { key: "role", label: "Vai trò" },
  { key: "salary", label: "Lương", render: (row) => formatVND(row.salary) },
  { key: "status", label: "Trạng thái" },
  {
    key: "account",
    label: "Tài khoản",
    render: (row) =>
      row.account ? (
        <span className={row.account.isActive ? "badge badge-success" : "badge badge-danger"}>{row.account.username}</span>
      ) : (
        <span className="badge">Chưa có</span>
      ),
  },
];

const fields = [
  { name: "name", label: "Họ tên", type: "text", required: true },
  { name: "phone", label: "Số điện thoại", type: "text", required: true },
  { name: "email", label: "Email", type: "text", required: true },
  { name: "role", label: "Vai trò", type: "text", required: true, placeholder: "Manager, Cashier, Barista..." },
  {
    name: "permissions",
    label: "Quyền (phân tách bằng dấu phẩy)",
    type: "text",
    placeholder: "create_order, view_report",
    toPayload: (raw) => (raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []),
    fromRow: (value) => (Array.isArray(value) ? value.join(", ") : ""),
  },
  { name: "salary", label: "Lương (VNĐ)", type: "number", required: true },
  { name: "hireDate", label: "Ngày vào làm", type: "date", required: true },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    required: true,
    options: [
      { value: "Working", label: "Working" },
      { value: "On Leave", label: "On Leave" },
      { value: "Resigned", label: "Resigned" },
    ],
  },
];

const EmployeesPage = () => {
  const [managing, setManaging] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const openAccount = (row) => {
    setManaging(row);
    setUsername(row.account?.username || "");
    setPassword("");
    setError("");
  };

  const submitAccount = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await http.put(`/employees/${managing._id}/account`, { username, password });
      setManaging(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <ResourcePage
        key={refreshKey}
        title="Nhân viên"
        endpoint="/employees"
        columns={columns}
        fields={fields}
        module="employees"
        extraActions={(row) => (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => openAccount(row)}>
            Tài khoản
          </button>
        )}
      />
      {managing && (
        <Modal title={`Tài khoản đăng nhập: ${managing.name}`} onClose={() => setManaging(null)}>
          <form onSubmit={submitAccount} className="form-grid">
            <label className="form-field">
              <span>Tên đăng nhập</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </label>
            <label className="form-field">
              <span>Mật khẩu mới (tối thiểu 6 ký tự)</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setManaging(null)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Lưu tài khoản
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default EmployeesPage;
