import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import AuthMiddleware from "../../src/Page/Auth/AuthMiddlewar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen">
      <AuthMiddleware >
          <Sidebar />
      </AuthMiddleware>
      <main className="flex-1 p-6 bg-gray-100">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
