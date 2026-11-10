import ResourcePage from "../components/ResourcePage";

const statusClass = {
  Available: "badge badge-success",
  Occupied: "badge badge-danger",
  Reserved: "badge badge-warning",
};

const columns = [
  { key: "tableNumber", label: "Số bàn" },
  { key: "area", label: "Khu vực" },
  { key: "capacity", label: "Sức chứa" },
  {
    key: "status",
    label: "Trạng thái",
    render: (row) => <span className={statusClass[row.status] || "badge"}>{row.status}</span>,
  },
];

const fields = [
  { name: "tableNumber", label: "Số bàn", type: "number", required: true },
  { name: "area", label: "Khu vực", type: "text", required: true },
  { name: "capacity", label: "Sức chứa", type: "number", required: true },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    required: true,
    options: [
      { value: "Available", label: "Available" },
      { value: "Occupied", label: "Occupied" },
      { value: "Reserved", label: "Reserved" },
    ],
  },
];

const TablesPage = () => <ResourcePage title="Bàn" endpoint="/tables" columns={columns} fields={fields} module="tables" />;

export default TablesPage;
