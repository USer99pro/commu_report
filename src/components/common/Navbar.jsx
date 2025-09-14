import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between">
      <h1 className="font-bold text-lg">Community Problem System</h1>
      <div className="space-x-4">
        <Link to="/">Home</Link>
        <Link to="/report">Report</Link>
        <Link to="/tracking">Tracking</Link>
        <Link to="/register">Login / Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
