import ResourcePage from "../components/ResourcePage";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const resolveEmployee = (row, refData) => {
  const list = refData?.["/employees"] || [];
  const found = list.find((e) => e._id === row.employeeId);
  return found ? found.name : row.employeeId;
};

const columns = [
  { key: "expenseCode", label: "Mã chi phí" },
  { key: "category", label: "Loại" },
  { key: "description", label: "Mô tả" },
  { key: "amount", label: "Số tiền", render: (row) => formatVND(row.amount) },
  { key: "expenseDate", label: "Ngày", render: (row) => new Date(row.expenseDate).toLocaleDateString("vi-VN") },
  { key: "employeeId", label: "Nhân viên", render: resolveEmployee },
  { key: "paymentMethod", label: "Thanh toán" },
];

const fields = [
  { name: "expenseCode", label: "Mã chi phí", type: "text", required: true },
  { name: "category", label: "Loại chi phí", type: "text", required: true },
  { name: "description", label: "Mô tả", type: "textarea", required: true },
  { name: "amount", label: "Số tiền (VNĐ)", type: "number", required: true },
  { name: "expenseDate", label: "Ngày chi", type: "date", required: true },
  { name: "employeeId", label: "Nhân viên chi", refEndpoint: "/employees", refLabelKey: "name", required: true },
  {
    name: "paymentMethod",
    label: "Hình thức thanh toán",
    type: "select",
    required: true,
    options: [
      { value: "Cash", label: "Cash" },
      { value: "Bank Transfer", label: "Bank Transfer" },
      { value: "E-Wallet", label: "E-Wallet" },
    ],
  },
];

const ExpensesPage = () => (
  <ResourcePage title="Chi phí" endpoint="/expenses" columns={columns} fields={fields} module="expenses" />
);

export default ExpensesPage;
