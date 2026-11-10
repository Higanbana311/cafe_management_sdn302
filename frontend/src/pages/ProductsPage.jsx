import { useEffect, useState } from "react";
import { http } from "../api/http";
import DataTable from "../components/DataTable";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { can } from "../auth/permissions";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const emptyIngredientRow = () => ({ ingredientId: "", quantity: "", unit: "" });

const emptyForm = () => ({
  name: "",
  categoryId: "",
  price: "",
  unit: "",
  isAvailable: true,
  instructions: "",
  ingredients: [emptyIngredientRow()],
});

const ProductsPage = () => {
  const { employee } = useAuth();
  const canManage = can(employee?.role, "products", "edit");
  // Barista can flip a product's "sold out" flag without full edit rights.
  const canQuickToggle = !canManage && can(employee?.role, "products", "toggleAvailability");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const categoryName = (id) => categories.find((c) => c._id === id)?.name || id;

  const columns = [
    { key: "name", label: "Tên sản phẩm" },
    { key: "categoryId", label: "Danh mục", render: (row) => categoryName(row.categoryId) },
    { key: "price", label: "Giá", render: (row) => formatVND(row.price) },
    { key: "unit", label: "Đơn vị" },
    {
      key: "isAvailable",
      label: "Trạng thái",
      render: (row) => <span className={row.isAvailable ? "badge badge-success" : "badge badge-danger"}>{row.isAvailable ? "Đang bán" : "Tạm ẩn"}</span>,
    },
  ];

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      // Only managers edit the recipe, so only they need the ingredient picker's data
      // (/ingredients is kitchen-only on the backend and would 403 for other roles).
      const [p, c, i] = await Promise.all([
        http.get("/products"),
        http.get("/categories"),
        canManage ? http.get("/ingredients") : Promise.resolve([]),
      ]);
      setProducts(p);
      setCategories(c);
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
      name: row.name,
      categoryId: row.categoryId,
      price: row.price,
      unit: row.unit,
      isAvailable: row.isAvailable,
      instructions: row.recipe?.instructions || "",
      ingredients:
        row.recipe?.ingredients?.length > 0
          ? row.recipe.ingredients.map((ing) => ({ ingredientId: ing.ingredientId, quantity: ing.quantity, unit: ing.unit }))
          : [emptyIngredientRow()],
    });
    setFormError("");
    setModalOpen(true);
  };

  const updateIngredientRow = (index, key, value) => {
    setForm((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = { ...ingredients[index], [key]: value };
      if (key === "ingredientId") {
        const ing = ingredientsList.find((i) => i._id === value);
        if (ing) ingredients[index].unit = ing.unit;
      }
      return { ...prev, ingredients };
    });
  };

  const addIngredientRow = () => setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, emptyIngredientRow()] }));
  const removeIngredientRow = (index) =>
    setForm((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        price: Number(form.price),
        unit: form.unit,
        isAvailable: form.isAvailable,
        recipe: {
          instructions: form.instructions,
          ingredients: form.ingredients
            .filter((r) => r.ingredientId)
            .map((r) => ({ ingredientId: r.ingredientId, quantity: Number(r.quantity), unit: r.unit })),
        },
      };
      if (editing) {
        await http.put(`/products/${editing._id}`, payload);
      } else {
        await http.post("/products", payload);
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
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await http.delete(`/products/${row._id}`);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAvailability = async (row) => {
    try {
      await http.patch(`/products/${row._id}/availability`, { isAvailable: !row.isAvailable });
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Sản phẩm</h2>
        {canManage && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Thêm mới
          </button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty-state">Đang tải...</div>
      ) : (
        <DataTable
          columns={columns}
          rows={products}
          onEdit={canManage ? openEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          extraActions={
            canQuickToggle
              ? (row) => (
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => toggleAvailability(row)}>
                    {row.isAvailable ? "Báo hết hàng" : "Mở bán lại"}
                  </button>
                )
              : undefined
          }
        />
      )}

      {modalOpen && (
        <Modal title={editing ? "Sửa sản phẩm" : "Thêm sản phẩm"} onClose={() => setModalOpen(false)} width="640px">
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="form-field">
              <span>Tên sản phẩm *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Danh mục *</span>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">-- Chọn --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Giá (VNĐ) *</span>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </label>
            <label className="form-field">
              <span>Đơn vị *</span>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="cup, cái..." required />
            </label>
            <label className="form-field form-field-checkbox">
              <span>Đang bán</span>
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            </label>
            <label className="form-field">
              <span>Hướng dẫn pha chế</span>
              <textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </label>

            <div className="items-editor">
              <div className="items-editor-header">
                <span>Công thức (nguyên liệu)</span>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addIngredientRow}>
                  + Thêm nguyên liệu
                </button>
              </div>
              {form.ingredients.map((row, idx) => (
                <div className="items-editor-row" key={idx}>
                  <select value={row.ingredientId} onChange={(e) => updateIngredientRow(idx, "ingredientId", e.target.value)}>
                    <option value="">-- Nguyên liệu --</option>
                    {ingredientsList.map((i) => (
                      <option key={i._id} value={i._id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="SL"
                    value={row.quantity}
                    onChange={(e) => updateIngredientRow(idx, "quantity", e.target.value)}
                  />
                  <input placeholder="Đơn vị" value={row.unit} onChange={(e) => updateIngredientRow(idx, "unit", e.target.value)} />
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeIngredientRow(idx)}>
                    ✕
                  </button>
                </div>
              ))}
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

export default ProductsPage;
