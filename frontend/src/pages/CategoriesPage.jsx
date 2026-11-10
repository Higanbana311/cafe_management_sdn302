import ResourcePage from "../components/ResourcePage";

const columns = [
  { key: "name", label: "Tên" },
  { key: "description", label: "Mô tả" },
  { key: "status", label: "Trạng thái" },
];

const fields = [
  { name: "name", label: "Tên danh mục", type: "text", required: true },
  { name: "description", label: "Mô tả", type: "textarea" },
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

const CategoriesPage = () => (
  <ResourcePage title="Danh mục" endpoint="/categories" columns={columns} fields={fields} module="categories" />
);

export default CategoriesPage;
