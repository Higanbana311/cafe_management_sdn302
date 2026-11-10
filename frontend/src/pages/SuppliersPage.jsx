import ResourcePage from "../components/ResourcePage";

const columns = [
  { key: "name", label: "Tên" },
  { key: "phone", label: "SĐT" },
  { key: "email", label: "Email" },
  { key: "address", label: "Địa chỉ" },
  { key: "status", label: "Trạng thái" },
];

const fields = [
  { name: "name", label: "Tên nhà cung cấp", type: "text", required: true },
  { name: "phone", label: "Số điện thoại", type: "text", required: true },
  { name: "email", label: "Email", type: "text", required: true },
  { name: "address", label: "Địa chỉ", type: "text", required: true },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    required: true,
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
  },
];

const SuppliersPage = () => (
  <ResourcePage title="Nhà cung cấp" endpoint="/suppliers" columns={columns} fields={fields} module="suppliers" />
);

export default SuppliersPage;
