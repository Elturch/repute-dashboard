import { Navigate, Outlet } from "react-router-dom";
import { isSuperadmin } from "@/lib/auth";

export default function RequireSuperadmin() {
  return isSuperadmin() ? <Outlet /> : <Navigate to="/dashboard/privados" replace />;
}
