import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedEmployee = localStorage.getItem("employee");
    if (savedToken && savedEmployee) {
      setToken(savedToken);
      setEmployee(JSON.parse(savedEmployee));
    }
    setReady(true);
  }, []);

  const login = async (username, password) => {
    const data = await http.post("/auth/login", { username, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("employee", JSON.stringify(data.employee));
    setToken(data.token);
    setEmployee(data.employee);
    return data.employee;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");
    setToken(null);
    setEmployee(null);
  };

  const value = useMemo(() => ({ employee, token, ready, login, logout }), [employee, token, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
