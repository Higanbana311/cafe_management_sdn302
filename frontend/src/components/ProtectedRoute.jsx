import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { token, ready } = useAuth();
  if (!ready) return null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
