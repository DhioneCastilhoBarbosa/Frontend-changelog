// src/routes/PrivateRoute.tsx
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function PrivateRoute({ children, isAuthenticated }: PrivateRouteProps) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
