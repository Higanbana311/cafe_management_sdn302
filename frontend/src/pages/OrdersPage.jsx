import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { can } from "../auth/permissions";
import { ORDER_STATUS_OPTIONS as STATUS_OPTIONS } from "../constants/orderStatus";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";
const formatDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "-");

// 1 member point = 1,000 VND off the order (matches backend POINT_VALUE_VND).
const POINT_VALUE_VND = 1000;

const emptyItemRow = () => ({ productId: "", productName: "", quantity: "", unitPrice: "" });

const emptyForm = () => ({
  orderCode: "",
  orderType: "Dine-in",
  tableId: "",
  customerId: "",
  employeeId: "",
  discountAmount: "",
  pointsUsed: "",
  promoCode: "",
  promotion: null,
  orderStatus: "Pending",
  paymentMethod: "Cash",
  paymentStatus: "Unpaid",
  items: [emptyItemRow()],
});

const computeSubtotal = (row) => (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0);

const OrdersPage = () => {
  const { employee } = useAuth();
  const canCreate = can(employee?.role, "orders", "create");
  const canEdit = can(employee?.role, "orders", "edit");
  const canDelete = can(employee?.role, "orders", "delete");
  // Same role set as canEdit: only cashier/manager reconcile payment & discounts.
  const canManagePayment = canEdit;

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const tableLabel = (id) => {
    const t = tables.find((x) => x._id === id);
    return t ? `Bàn ${t.tableNumber} (${t.area})` : id;
  };
  const customerName = (id) => customers.find((c) => c._id === id)?.name || "Khách lẻ";
  const employeeName = (id) => employees.find((e) => e._id === id)?.name || id;

  const columns = [
    { key: "orderCode", label: "Mã đơn" },
    { key: "orderDate", label: "Ngày đặt", render: (row) => formatDate(row.orderDate) },
    { key: "orderType", label: "Loại" },
    { key: "tableId", label: "Bàn", render: (row) => (row.orderType === "Dine-in" ? tableLabel(row.tableId) : "-") },
    { key: "customerId", label: "Khách hàng", render: (row) => (row.customerId ? customerName(row.customerId) : "Khách lẻ") },
    { key: "employeeId", label: "Nhân viên", render: (row) => employeeName(row.employeeId) },
    { key: "totalAmount", label: "Tổng tiền", render: (row) => formatVND(row.totalAmount) },
    {
      key: "orderStatus",
      label: "Trạng thái",
      render: (row) => (
        <select
          value={row.orderStatus}
          onChange={(e) => updateStatus(row, e.target.value)}
          className="status-select"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    { key: "payment", label: "Thanh toán", render: (row) => `${row.payment?.status} (${row.payment?.method || "-"})` },
  ];

  const visibleOrders = useMemo(() => {
    let list = orders;
    if (statusFilter) list = list.filter((o) => o.orderStatus === statusFilter);
    if (dateFrom) list = list.filter((o) => new Date(o.orderDate) >= new Date(dateFrom));
    if (dateTo) list = list.filter((o) => new Date(o.orderDate) <= new Date(`${dateTo}T23:59:59.999`));
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (o) => o.orderCode.toLowerCase().includes(term) || customerName(o.customerId).toLowerCase().includes(term),
      );
    }
    return list;
  }, [orders, statusFilter, dateFrom, dateTo, search, customers]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [o, t, c, e, p] = await Promise.all([
        http.get("/orders"),
        http.get("/tables"),
        http.get("/customers"),
        http.get("/employees"),
        http.get("/products"),
      ]);
      setOrders(o);
      setTables(t);
      setCustomers(c);
      setEmployees(e);
      setProductsList(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateStatus = async (row, newStatus) => {
    try {
      await http.patch(`/orders/${row._id}/status`, { orderStatus: newStatus });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      orderCode: row.orderCode,
      orderType: row.orderType,
      tableId: row.tableId || "",
      customerId: row.customerId || "",
      employeeId: row.employeeId,
      discountAmount: row.discountAmount || 0,
      pointsUsed: row.pointsUsed || 0,
      promoCode: row.promotion?.code || "",
      promotion: row.promotion || null,
      orderStatus: row.orderStatus,
      paymentMethod: row.payment?.method || "Cash",
      paymentStatus: row.payment?.status || "Unpaid",
      items: row.items.map((it) => ({ productId: it.productId, productName: it.productName, quantity: it.quantity, unitPrice: it.unitPrice })),
    });
    setFormError("");
    setModalOpen(true);
  };

  const updateItemRow = (index, key, value) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };
      if (key === "productId") {
        const p = productsList.find((x) => x._id === value);
        if (p) {
          items[index].productName = p.name;
          items[index].unitPrice = p.price;
        }
      }
      return { ...prev, items };
    });
  };

  const addItemRow = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItemRow()] }));
  const removeItemRow = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));

  const subTotal = form.items.reduce((sum, row) => sum + computeSubtotal(row), 0);

  const selectedCustomer = customers.find((c) => c._id === form.customerId);
  // Points this order already spent (when editing) go back into the pool
  // while that same customer stays selected, so they can be re-entered.
  const availablePoints = selectedCustomer
    ? selectedCustomer.memberPoint + (editing && editing.customerId === form.customerId ? editing.pointsUsed || 0 : 0)
    : 0;
  const pointsDiscount = Math.min(Number(form.pointsUsed) || 0, availablePoints) * POINT_VALUE_VND;
  const total = Math.max(0, subTotal - (Number(form.discountAmount) || 0) - pointsDiscount);

  const applyPromoCode = async () => {
    if (!form.promoCode.trim()) return;
    setPromoApplying(true);
    setPromoError("");
    try {
      const result = await http.get(`/promotions/validate/${form.promoCode.trim()}?orderAmount=${subTotal}`);
      setForm((prev) => ({ ...prev, promotion: result.promotion, discountAmount: result.discountAmount }));
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setPromoApplying(false);
    }
  };

  const clearPromoCode = () => {
    setForm((prev) => ({ ...prev, promoCode: "", promotion: null, discountAmount: 0 }));
    setPromoError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        orderCode: form.orderCode,
        orderType: form.orderType,
        tableId: form.tableId,
        customerId: form.customerId || null,
        employeeId: form.employeeId,
        orderStatus: form.orderStatus,
        subTotal,
        promotion: form.promotion || null,
        discountAmount: Number(form.discountAmount) || 0,
        pointsUsed: Math.min(Number(form.pointsUsed) || 0, availablePoints),
        totalAmount: total,
        payment: {
          method: form.paymentMethod,
          status: form.paymentStatus,
          amount: form.paymentStatus === "Paid" ? total : 0,
        },
        items: form.items
          .filter((r) => r.productId)
          .map((r) => ({
            productId: r.productId,
            productName: r.productName,
            quantity: Number(r.quantity),
            unitPrice: Number(r.unitPrice),
            subtotal: computeSubtotal(r),
          })),
      };
      if (editing) {
        await http.put(`/orders/${editing._id}`, payload);
      } else {
        await http.post("/orders", payload);
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
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await http.delete(`/orders/${row._id}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Đơn hàng</h2>
        {canCreate && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Tạo đơn hàng
          </button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="filter-bar">
        <input
          className="filter-search"
          placeholder="Tìm theo mã đơn, khách hàng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Từ ngày" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Đến ngày" />
      </div>
      {loading ? (
        <div className="empty-state">Đang tải...</div>
      ) : (
        <DataTable columns={columns} rows={visibleOrders} onEdit={canEdit ? openEdit : undefined} onDelete={canDelete ? handleDelete : undefined} />
      )}

      {modalOpen && (
        <Modal title={editing ? "Sửa đơn hàng" : "Tạo đơn hàng"} onClose={() => setModalOpen(false)} width="760px">
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-field">
              <span>Mã đơn *</span>
              <input value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Loại đơn *</span>
              <select
                value={form.orderType}
                onChange={(e) =>
                  setForm({ ...form, orderType: e.target.value, tableId: e.target.value === "Dine-in" ? form.tableId : "" })
                }
                required
              >
                <option value="Dine-in">Dine-in</option>
                <option value="Takeaway">Takeaway</option>
                <option value="Delivery">Delivery</option>
              </select>
            </label>
            <label className="form-field">
              <span>Bàn {form.orderType === "Dine-in" ? "*" : ""}</span>
              <select
                value={form.tableId}
                onChange={(e) => setForm({ ...form, tableId: e.target.value })}
                required={form.orderType === "Dine-in"}
                disabled={form.orderType !== "Dine-in"}
              >
                <option value="">-- Chọn bàn --</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Bàn {t.tableNumber} ({t.area}) - {t.status}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Khách hàng</span>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value, pointsUsed: "" })}
              >
                <option value="">Khách lẻ</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.memberPoint || 0} điểm)
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Nhân viên phục vụ *</span>
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
              <span>Trạng thái đơn *</span>
              <select value={form.orderStatus} onChange={(e) => setForm({ ...form, orderStatus: e.target.value })} required>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {canManagePayment ? (
              <>
                <div className="form-field">
                  <span>Mã khuyến mãi</span>
                  <div className="promo-row">
                    <input
                      value={form.promoCode}
                      onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                      placeholder="Nhập mã..."
                    />
                    {form.promotion ? (
                      <button type="button" className="btn btn-sm btn-secondary" onClick={clearPromoCode}>
                        Bỏ mã
                      </button>
                    ) : (
                      <button type="button" className="btn btn-sm btn-secondary" onClick={applyPromoCode} disabled={promoApplying}>
                        {promoApplying ? "Đang kiểm tra..." : "Áp dụng"}
                      </button>
                    )}
                  </div>
                  {promoError && <span className="field-error">{promoError}</span>}
                  {form.promotion && (
                    <span className="field-hint">
                      Đã áp mã "{form.promotion.code}" (
                      {form.promotion.discountType === "Percentage" ? `${form.promotion.discountValue}%` : formatVND(form.promotion.discountValue)}
                      )
                    </span>
                  )}
                </div>
                <label className="form-field">
                  <span>Giảm giá (VNĐ)</span>
                  <input type="number" value={form.discountAmount} onChange={(e) => setForm({ ...form, discountAmount: e.target.value })} />
                </label>
                <div className="form-field">
                  <span>Dùng điểm tích lũy (1 điểm = {formatVND(POINT_VALUE_VND)})</span>
                  <input
                    type="number"
                    min="0"
                    max={availablePoints}
                    value={form.pointsUsed}
                    disabled={!form.customerId}
                    onChange={(e) =>
                      setForm({ ...form, pointsUsed: Math.max(0, Math.min(Number(e.target.value) || 0, availablePoints)) })
                    }
                  />
                  <span className="field-hint">
                    {form.customerId
                      ? `Khách còn ${availablePoints} điểm (tương đương ${formatVND(availablePoints * POINT_VALUE_VND)})`
                      : "Chọn khách hàng để dùng điểm."}
                    {pointsDiscount > 0 && ` — Đang giảm ${formatVND(pointsDiscount)} từ điểm.`}
                  </span>
                </div>
                <label className="form-field">
                  <span>Hình thức thanh toán</span>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Trạng thái thanh toán</span>
                  <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Paid">Paid</option>
                  </select>
                </label>
              </>
            ) : (
              <div className="alert" style={{ background: "#eee7dd" }}>
                Giảm giá và thanh toán do thu ngân/quản lý xử lý. Đơn sẽ được tạo ở trạng thái "Chưa thanh toán".
              </div>
            )}

            <div className="items-editor">
              <div className="items-editor-header">
                <span>Danh sách món</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addItemRow}>
                  + Thêm món
                </button>
              </div>
              {form.items.map((row, idx) => (
                <div className="items-editor-row items-editor-row-wide" key={idx}>
                  <select value={row.productId} onChange={(e) => updateItemRow(idx, "productId", e.target.value)}>
                    <option value="">-- Sản phẩm --</option>
                    {productsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input type="number" placeholder="SL" value={row.quantity} onChange={(e) => updateItemRow(idx, "quantity", e.target.value)} />
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
              <div className="items-editor-total">
                Tạm tính: {formatVND(subTotal)} — Giảm giá: {formatVND(Number(form.discountAmount) || 0)}
                {pointsDiscount > 0 && ` — Điểm: -${formatVND(pointsDiscount)}`} — <strong>Thành tiền: {formatVND(total)}</strong>
              </div>
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

export default OrdersPage;
