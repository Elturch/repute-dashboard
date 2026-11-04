import { Navigate } from "react-router-dom";
import { isSuperadmin } from "@/lib/auth";
import ResumenGlobal from "@/pages/dashboard/core/ResumenGlobal";

export default function DashboardHome() {
  return isSuperadmin() ? <ResumenGlobal /> : <Navigate to="/dashboard/privados" replace />;
}
