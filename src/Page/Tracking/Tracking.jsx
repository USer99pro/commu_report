import { useEffect, useState } from "react";
import { supabase } from "../../config/SupabaseClient";
import { RefreshCw } from "lucide-react"; // ✅ ใช้ icon refresh

// ฟังก์ชันแปลงสถานะเป็นภาษาไทย
const statusToThai = (status) => {
  switch (status) {
    case "pending":
      return "รอดำเนินการ";
    case "in_progress":
      return "กำลังดำเนินการ";
    case "resolved":
      return "เสร็จสิ้น";
    default:
      return status;
  }
};

// ฟังก์ชันกำหนดสี bg และ text ของสถานะ
const statusColor = (status) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const Tracking = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

      const { data, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (problemsError) throw problemsError;

      setProblems(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">📋 ติดตามปัญหา</h2>
          <p className="text-gray-600 text-sm">
            หน้านี้จะแสดงสถานะของปัญหาที่คุณแจ้ง
          </p>
        </div>
        <button
          onClick={fetchProblems}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" /> รีเฟรช
        </button>
      </div>

      {loading && <p>กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-red-500 mb-4">เกิดข้อผิดพลาด: {error}</p>}

      {problems.length === 0 && !loading && (
        <p className="text-gray-600 text-center">ยังไม่มีปัญหาที่คุณแจ้ง</p>
      )}

      <div className="space-y-4">
        {problems.map((problem) => (
          <div
            key={problem.id}
            className="border rounded-lg bg-white shadow hover:shadow-md transition p-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">{problem.title}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor(
                  problem.status
                )}`}
              >
                {statusToThai(problem.status)}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{problem.description}</p>
            <p className="text-xs text-gray-500">
              วันที่แจ้ง: {new Date(problem.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tracking;
