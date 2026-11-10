import ResourcePage from "../components/ResourcePage";

const columns = [
  { key: "name", label: "Tên" },
  { key: "phone", label: "SĐT" },
  { key: "email", label: "Email" },
  { key: "tier", label: "Hạng" },
  { key: "memberPoint", label: "Điểm" },
  { key: "status", label: "Trạng thái" },
];

const fields = [
  { name: "name", label: "Tên khách hàng", type: "text", required: true },
  { name: "phone", label: "Số điện thoại", type: "text", required: true },
  { name: "email", label: "Email", type: "text", required: true },
  {
    name: "tier",
    label: "Hạng thành viên",
    type: "select",
    required: true,
    options: [
      { value: "Member", label: "Member" },
      { value: "Silver", label: "Silver" },
      { value: "Gold", label: "Gold" },
      { value: "VIP", label: "VIP" },
    ],
  },
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

const CustomersPage = () => (
  <ResourcePage title="Khách hàng" endpoint="/customers" columns={columns} fields={fields} module="customers" />
);

export default CustomersPage;
