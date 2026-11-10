import ResourcePage from "../components/ResourcePage";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN") + " đ";

const columns = [
  { key: "code", label: "Mã" },
  { key: "description", label: "Mô tả" },
  {
    key: "discountValue",
    label: "Giảm giá",
    render: (row) => (row.discountType === "Percentage" ? `${row.discountValue}%` : formatVND(row.discountValue)),
  },
  { key: "minOrderAmount", label: "Đơn tối thiểu", render: (row) => formatVND(row.minOrderAmount) },
  {
    key: "endDate",
    label: "Hết hạn",
    render: (row) => (row.endDate ? new Date(row.endDate).toLocaleDateString("vi-VN") : "Không giới hạn"),
  },
  {
    key: "isActive",
    label: "Trạng thái",
    render: (row) => <span className={row.isActive ? "badge badge-success" : "badge badge-danger"}>{row.isActive ? "Đang áp dụng" : "Đã tắt"}</span>,
  },
];

const fields = [
  { name: "code", label: "Mã khuyến mãi", type: "text", required: true, placeholder: "SUMMER10" },
  { name: "description", label: "Mô tả", type: "textarea" },
  {
    name: "discountType",
    label: "Loại giảm giá",
    type: "select",
    required: true,
    options: [
      { value: "Percentage", label: "Theo phần trăm (%)" },
      { value: "Fixed", label: "Số tiền cố định (VNĐ)" },
    ],
  },
  { name: "discountValue", label: "Giá trị giảm", type: "number", required: true },
  { name: "minOrderAmount", label: "Giá trị đơn tối thiểu (VNĐ)", type: "number" },
  { name: "startDate", label: "Ngày bắt đầu", type: "date" },
  { name: "endDate", label: "Ngày kết thúc", type: "date" },
  { name: "isActive", label: "Đang áp dụng", type: "checkbox", defaultValue: true },
];

const PromotionsPage = () => (
  <ResourcePage title="Khuyến mãi" endpoint="/promotions" columns={columns} fields={fields} module="promotions" />
);

export default PromotionsPage;
