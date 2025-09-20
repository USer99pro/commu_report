import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const goToReport = () => {
    navigate("/register"); // path ที่คุณตั้งไว้ใน router ของคุณ
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-900">
      <div className="max-w-xl text-center px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
          Welcome to Community Problem Management System
        </h1>
        <p className="text-gray-600 text-lg">
          ระบบสำหรับแจ้งปัญหาในชุมชน และติดตามสถานะปัญหาได้อย่างสะดวก
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goToReport}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700"
          >
            เริ่มแจ้งปัญหา
          </button>
          <button className="px-6 py-3 border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50">
            เรียนรู้เพิ่มเติม
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
