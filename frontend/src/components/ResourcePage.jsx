import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import DataTable from "./DataTable";
import Modal from "./Modal";
import FormField from "./FormField";
import { useAuth } from "../context/AuthContext";
import { can } from "../auth/permissions";

const buildDefaults = (fields) => {
  const defaults = {};
  fields.forEach((f) => {
    defaults[f.name] = f.type === "checkbox" ? f.defaultValue ?? false : f.defaultValue ?? "";
  });
  return defaults;
};

const coerceValues = (fields, values) => {
  const payload = {};
  fields.forEach((f) => {
    const raw = values[f.name];
    if (f.toPayload) {
      payload[f.name] = f.toPayload(raw);
    } else if (f.type === "number") {
      payload[f.name] = raw === "" ? undefined : Number(raw);
    } else {
      payload[f.name] = raw === "" ? undefined : raw;
    }
  });
  return payload;
};

const ResourcePage = ({
  title,
  endpoint,
  columns,
  fields,
  idKey = "_id",
  extraActions,
  afterChange,
  module,
  searchable = true,
  extraFilter,
  filterBar,
}) => {
  const { employee } = useAuth();
  const allowCreate = !module || can(employee?.role, module, "create");
  const allowEdit = !module || can(employee?.role, module, "edit");
  const allowDelete = !module || can(employee?.role, module, "delete");

  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [refData, setRefData] = useState({});

  const refEndpoints = useMemo(
    () => [...new Set(fields.filter((f) => f.refEndpoint).map((f) => f.refEndpoint))],
    [fields],
  );

  const loadList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await http.get(endpoint);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRefData = async () => {
    const entries = await Promise.all(
      refEndpoints.map(async (ep) => {
        try {
          return [ep, await http.get(ep)];
        } catch {
          return [ep, []];
        }
      }),
    );
    setRefData(Object.fromEntries(entries));
  };

  useEffect(() => {
    loadList();
    if (refEndpoints.length > 0) loadRefData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const openAdd = () => {
    setEditing(null);
    setValues(buildDefaults(fields));
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const initial = {};
    fields.forEach((f) => {
      let v = row[f.name];
      if (f.fromRow) {
        v = f.fromRow(v, row);
      } else {
        // list endpoints may return populated ref objects instead of bare ids
        if (v && typeof v === "object" && "_id" in v) v = v._id;
        if (f.type === "datetime-local" && typeof v === "string") v = v.slice(0, 16);
        if (f.type === "date" && typeof v === "string") v = v.slice(0, 10);
      }
      initial[f.name] = v ?? (f.type === "checkbox" ? false : "");
    });
    setValues(initial);
    setFormError("");
    setModalOpen(true);
  };

  const handleChange = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = coerceValues(fields, values);
      if (editing) {
        await http.put(`${endpoint}/${editing[idKey]}`, payload);
      } else {
        await http.post(endpoint, payload);
      }
      setModalOpen(false);
      await loadList();
      if (afterChange) afterChange();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;
    try {
      await http.delete(`${endpoint}/${row[idKey]}`);
      await loadList();
      if (afterChange) afterChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const decoratedColumns = columns.map((col) => ({
    ...col,
    render: col.render ? (row) => col.render(row, refData) : undefined,
  }));

  const visibleItems = useMemo(() => {
    let list = items;
    if (extraFilter) list = list.filter(extraFilter);
    if (searchable && search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((v) => {
          if (v === null || v === undefined || typeof v === "object") return false;
          return String(v).toLowerCase().includes(term);
        }),
      );
    }
    return list;
  }, [items, search, extraFilter, searchable]);

  return (
    <div className="page">
      <div className="page-header">
        <h2>{title}</h2>
        {allowCreate && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Thêm mới
          </button>
        )}
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {(searchable || filterBar) && (
        <div className="filter-bar">
          {searchable && (
            <input
              className="filter-search"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          {filterBar}
        </div>
      )}
      {loading ? (
        <div className="empty-state">Đang tải...</div>
      ) : (
        <DataTable
          columns={decoratedColumns}
          rows={visibleItems}
          idKey={idKey}
          onEdit={allowEdit ? openEdit : undefined}
          onDelete={allowDelete ? handleDelete : undefined}
          extraActions={extraActions}
        />
      )}

      {modalOpen && (
        <Modal title={editing ? `Sửa ${title}` : `Thêm ${title}`} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="form-grid">
            {fields.map((f) => (
              <FormField key={f.name} field={f} value={values[f.name]} onChange={handleChange} refData={refData} />
            ))}
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

export default ResourcePage;
