import { Routes, Route } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import AdminLayout from "../Layout/AdminLayout";
import Home from "../Page/Home/Home";
import Report from "../Page/Reports/Reports";
import Tracking from "../Page/Tracking/Tracking";
import Register from "../Page/Auth/Register";
import Dashboard from "../Page/Admin/dashborads";
import ForgotPassword from "../Page/Auth/ForgotPassword";
import ResetPassword from "../Page/Auth/ResetPassword";
const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/tracking" element={<Tracking />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/Reset-Password" element={<ResetPassword />} />

      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
