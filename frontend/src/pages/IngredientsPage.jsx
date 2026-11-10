import { useState } from "react";
import ResourcePage from "../components/ResourcePage";
import Modal from "../components/Modal";
import { http } from "../api/http";

const resolveSupplier = (row, refData) => {
  const list = refData?.["/suppliers"] || [];
  const found = list.find((s) => s._id === row.supplierId);
  return found ? found.name : row.supplierId;
};

const columns = [
  { key: "name", label: "Tên nguyên liệu" },
  { key: "category", label: "Loại" },
  {
    key: "stock",
    label: "Tồn kho",
    render: (row) => (
      <span className={row.stock <= row.minStock ? "badge badge-danger" : ""}>
        {row.stock} {row.unit}
      </span>
    ),
  },
  { key: "minStock", label: "Tối thiểu" },
  { key: "supplierId", label: "Nhà cung cấp", render: resolveSupplier },
];

const fields = [
  { name: "name", label: "Tên nguyên liệu", type: "text", required: true },
  { name: "category", label: "Loại", type: "text", required: true },
  { name: "unit", label: "Đơn vị", type: "text", required: true },
  { name: "stock", label: "Tồn kho", type: "number", step: "0.01", required: true },
  { name: "minStock", label: "Tồn kho tối thiểu", type: "number", step: "0.01", required: true },
  { name: "supplierId", label: "Nhà cung cấp", refEndpoint: "/suppliers", refLabelKey: "name", required: true },
];

const IngredientsPage = () => {
  const [adjusting, setAdjusting] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState("add");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const submitAdjust = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await http.patch(`/ingredients/${adjusting._id}/stock`, { quantity: Number(quantity), type });
      setAdjusting(null);
      setQuantity("");
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <ResourcePage
        key={refreshKey}
        title="Nguyên liệu"
        endpoint="/ingredients"
        columns={columns}
        fields={fields}
        module="ingredients"
        extraFilter={lowStockOnly ? (row) => row.stock <= row.minStock : undefined}
        filterBar={
          <label className="filter-checkbox">
            <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
            Chỉ hiện sắp hết hàng
          </label>
        }
        extraActions={(row) => (
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setAdjusting(row)}>
            Nhập/Xuất kho
          </button>
        )}
      />
      {adjusting && (
        <Modal title={`Điều chỉnh kho: ${adjusting.name}`} onClose={() => setAdjusting(null)}>
          <form onSubmit={submitAdjust} className="form-grid">
            <label className="form-field">
              <span>Loại</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="add">Nhập thêm</option>
                <option value="subtract">Xuất kho</option>
              </select>
            </label>
            <label className="form-field">
              <span>Số lượng ({adjusting.unit})</span>
              <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </label>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAdjusting(null)}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Xác nhận
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default IngredientsPage;
