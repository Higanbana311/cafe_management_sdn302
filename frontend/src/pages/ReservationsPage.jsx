import ResourcePage from "../components/ResourcePage";

const resolveRef = (value, refData, endpoint, labelFn) => {
  if (value && typeof value === "object") return labelFn(value);
  const item = (refData?.[endpoint] || []).find((x) => x._id === value);
  return item ? labelFn(item) : value;
};

const columns = [
  { key: "reservationCode", label: "Mã đặt bàn" },
  {
    key: "customerId",
    label: "Khách hàng",
    render: (row, refData) => resolveRef(row.customerId, refData, "/customers", (c) => c.name),
  },
  {
    key: "tableId",
    label: "Bàn",
    render: (row, refData) => resolveRef(row.tableId, refData, "/tables", (t) => `Bàn ${t.tableNumber}`),
  },
  { key: "reservationDate", label: "Thời gian", render: (row) => new Date(row.reservationDate).toLocaleString("vi-VN") },
  { key: "guestCount", label: "Số khách" },
  { key: "status", label: "Trạng thái" },
];

const fields = [
  { name: "reservationCode", label: "Mã đặt bàn", type: "text", required: true },
  { name: "customerId", label: "Khách hàng", refEndpoint: "/customers", refLabelKey: "name", required: true },
  {
    name: "tableId",
    label: "Bàn",
    refEndpoint: "/tables",
    required: true,
    refLabelKey: "tableNumber",
  },
  { name: "reservationDate", label: "Thời gian đặt", type: "datetime-local", required: true },
  { name: "guestCount", label: "Số khách", type: "number", required: true },
  { name: "note", label: "Ghi chú", type: "textarea" },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    required: true,
    options: [
      { value: "Confirmed", label: "Confirmed" },
      { value: "Completed", label: "Completed" },
      { value: "Cancelled", label: "Cancelled" },
    ],
  },
];

const ReservationsPage = () => (
  <ResourcePage title="Đặt bàn" endpoint="/reservations" columns={columns} fields={fields} module="reservations" />
);

export default ReservationsPage;
