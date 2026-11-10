const FormField = ({ field, value, onChange, refData }) => {
  const { name, label, type = "text", required, options, refEndpoint, refLabelKey = "name", refValueKey = "_id", placeholder, step } = field;

  const handle = (e) => {
    const raw = e.target.value;
    if (type === "checkbox") return onChange(name, e.target.checked);
    if (type === "number") return onChange(name, raw === "" ? "" : raw);
    onChange(name, raw);
  };

  let input;
  if (type === "textarea") {
    input = (
      <textarea value={value ?? ""} onChange={handle} placeholder={placeholder} rows={3} />
    );
  } else if (type === "checkbox") {
    input = <input type="checkbox" checked={!!value} onChange={handle} />;
  } else if (type === "select" || refEndpoint) {
    const opts = refEndpoint ? (refData?.[refEndpoint] || []).map((o) => ({ value: o[refValueKey], label: o[refLabelKey] })) : options || [];
    input = (
      <select value={value ?? ""} onChange={handle}>
        <option value="">-- Chọn --</option>
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else {
    input = (
      <input
        type={type}
        step={step}
        value={value ?? ""}
        onChange={handle}
        placeholder={placeholder}
      />
    );
  }

  return (
    <label className={"form-field" + (type === "checkbox" ? " form-field-checkbox" : "")}>
      <span>
        {label}
        {required && <span className="required-mark">*</span>}
      </span>
      {input}
    </label>
  );
};

export default FormField;
