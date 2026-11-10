const DataTable = ({ columns, rows, idKey = "_id", onEdit, onDelete, extraActions }) => {
  if (!rows || rows.length === 0) {
    return <div className="empty-state">Chưa có dữ liệu.</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {(onEdit || onDelete || extraActions) && <th className="col-actions">Hành động</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[idKey]}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
              {(onEdit || onDelete || extraActions) && (
                <td className="col-actions">
                  {extraActions && extraActions(row)}
                  {onEdit && (
                    <button className="btn btn-sm btn-secondary" onClick={() => onEdit(row)}>
                      Sửa
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn btn-sm btn-danger" onClick={() => onDelete(row)}>
                      Xóa
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
