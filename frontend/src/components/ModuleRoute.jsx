import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canView } from "../auth/permissions";

const ModuleRoute = ({ module, children }) => {
  const { employee } = useAuth();
  if (!canView(employee?.role, module)) return <Navigate to="/" replace />;
  return children;
};

export default ModuleRoute;
