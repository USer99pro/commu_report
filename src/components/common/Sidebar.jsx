import { Link } from "react-router-dom";
import { HomeIcon, ChartBarIcon } from "@heroicons/react/24/outline";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white shadow-md p-4">
      <h2 className="font-bold text-xl mb-6">Admin</h2>
      <nav className="flex flex-col gap-2">
        <Link to="/admin" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
          <HomeIcon className="w-5 h-5" />
          Dashboard
        </Link>
        <Link to="/admin/reports" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
          <ChartBarIcon className="w-5 h-5" />
          Reports
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;
