import { useEffect, useState } from "react";
import { http } from "../api/http";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const emptyItemRow = () => ({ ingredientId: "", name: "", quantity: "", unit: "", unitPrice: "" });

const emptyForm = () => ({
  purchaseCode: "",
  supplierId: "",
  employeeId: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  paymentStatus: "Unpaid",
  status: "Pending",
  items: [emptyItemRow()],
});

const computeSubtotal = (row) => (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const supplierName = (id) => suppliers.find((s) => s._id === id)?.name || id;
  const employeeName = (id) => employees.find((e) => e._id === id)?.name || id;

  const columns = [
    { key: "purchaseCode", label: "Mã đơn" },
    { key: "supplierId", label: "Nhà cung cấp", render: (row) => supplierName(row.supplierId) },
    { key: "employeeId", label: "Người nhập", render: (row) => employeeName(row.employeeId) },
    { key: "purchaseDate", label: "Ngày", render: (row) => new Date(row.purchaseDate).toLocaleDateString("vi-VN") },
    { key: "totalAmount", label: "Tổng tiền", render: (row) => formatVND(row.totalAmount) },
    { key: "paymentStatus", label: "Thanh toán" },
    { key: "status", label: "Trạng thái" },
  ];

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [po, s, e, i] = await Promise.all([
        http.get("/purchase-orders"),
        http.get("/suppliers"),
        http.get("/employees"),
        http.get("/ingredients"),
      ]);
      setOrders(po);
      setSuppliers(s);
      setEmployees(e);
      setIngredientsList(i);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      purchaseCode: row.purchaseCode,
      supplierId: row.supplierId,
      employeeId: row.employeeId,
      purchaseDate: row.purchaseDate?.slice(0, 10),
      paymentStatus: row.paymentStatus,
      status: row.status,
      items: row.items.map((it) => ({ ingredientId: it.ingredientId, name: it.name, quantity: it.quantity, unit: it.unit, unitPrice: it.unitPrice })),
    });
    setFormError("");
    setModalOpen(true);
  };

  const updateItemRow = (index, key, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      if (key === "ingredientId") {
        const ing = ingredientsList.find((i) => i._id === value);
        if (ing) {
          items[index].name = ing.name;
          items[index].unit = ing.unit;
        }
      }
      return { ...prev, items };
    });
  };

  const addItemRow = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItemRow()] }));
  const removeItemRow = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const total = form.items.reduce((sum, row) => sum + computeSubtotal(row), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        purchaseCode: form.purchaseCode,
        supplierId: form.supplierId,
        employeeId: form.employeeId,
        purchaseDate: form.purchaseDate,
        paymentStatus: form.paymentStatus,
        status: form.status,
        totalAmount: total,
        items: form.items
          .filter((r) => r.ingredientId)
          .map((r) => ({
            ingredientId: r.ingredientId,
            name: r.name,
            quantity: Number(r.quantity),
            unit: r.unit,
            unitPrice: Number(r.unitPrice),
            subtotal: computeSubtotal(r),
          })),
      };
      if (editing) {
        await http.put(`/purchase-orders/${editing._id}`, payload);
      } else {
        await http.post("/purchase-orders", payload);
      }
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn nhập hàng này?")) return;
    try {
      await http.delete(`/purchase-orders/${row._id}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Đơn nhập hàng</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          + Thêm mới
        </button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <div className="empty-state">Đang tải...</div> : <DataTable columns={columns} rows={orders} onEdit={openEdit} onDelete={handleDelete} />}

      {modalOpen && (
        <Modal title={editing ? "Sửa đơn nhập hàng" : "Thêm đơn nhập hàng"} onClose={() => setModalOpen(false)} width="720px">
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-field">
              <span>Mã đơn *</span>
              <input value={form.purchaseCode} onChange={(e) => setForm({ ...form, purchaseCode: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Nhà cung cấp *</span>
              <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} required>
                <option value="">-- Chọn --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Người nhập *</span>
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
                <option value="">-- Chọn --</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Ngày nhập *</span>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Thanh toán *</span>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} required>
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
            </label>
            <label className="form-field">
              <span>Trạng thái *</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <span className="field-hint">Tồn kho nguyên liệu chỉ được cộng khi trạng thái là "Received".</span>
            </label>

            <div className="items-editor">
              <div className="items-editor-header">
                <span>Danh sách nguyên liệu nhập</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addItemRow}>
                  + Thêm dòng
                </button>
              </div>
              {form.items.map((row, idx) => (
                <div className="items-editor-row items-editor-row-wide" key={idx}>
                  <select value={row.ingredientId} onChange={(e) => updateItemRow(idx, "ingredientId", e.target.value)}>
                    <option value="">-- Nguyên liệu --</option>
                    {ingredientsList.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <input type="number" step="0.01" placeholder="SL" value={row.quantity} onChange={(e) => updateItemRow(idx, "quantity", e.target.value)} />
                  <input placeholder="Đơn vị" value={row.unit} onChange={(e) => updateItemRow(idx, "unit", e.target.value)} />
                  <input
                    type="number"
                    placeholder="Đơn giá"
                    value={row.unitPrice}
                    onChange={(e) => updateItemRow(idx, "unitPrice", e.target.value)}
                  />
                  <span className="items-editor-subtotal">{formatVND(computeSubtotal(row))}</span>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItemRow(idx)}>
                    ✕
                  </button>
                </div>
              ))}
              <div className="items-editor-total">Tổng cộng: {formatVND(total)}</div>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
