import { useEffect, useState } from "react";
import { supabase } from "../../config/SupabaseClient";

const Tracking = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ฟังก์ชันดึงข้อมูล
  const fetchProblems = async () => {
    try {
      setLoading(true);

      // ดึงข้อมูล user ปัจจุบันจาก session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

      // ดึงข้อมูลจาก problems table
      const { data, error: problemsError } = await supabase
        .from("problems")
        .select("*")
        .eq("user_id", user.id) // เฉพาะข้อมูลของ user ปัจจุบัน
        .order("created_at", { ascending: false });

      if (problemsError) throw problemsError;

      setProblems(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">ติดตามปัญหา</h2>
      <p className="mb-4">หน้านี้จะแสดงสถานะของปัญหาที่คุณแจ้ง</p>

      {loading && <p>กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-red-500">เกิดข้อผิดพลาด: {error}</p>}

      <ul className="space-y-4">
        {problems.map((problem) => (
          <li
            key={problem.id}
            className="p-4 border rounded-lg shadow bg-white"
          >
            <h3 className="font-semibold text-lg">{problem.title}</h3>
            <p className="text-gray-700">{problem.description}</p>
            <p className="text-sm text-gray-500">
              วันที่แจ้ง: {new Date(problem.created_at).toLocaleString()}
            </p>
            <p className="mt-2">
              <span className="font-medium">สถานะ:</span>{" "}
              <span
                className={
                  problem.status === "pending"
                    ? "text-yellow-600"
                    : problem.status === "in_progress"
                    ? "text-blue-600"
                    : "text-green-600"
                }
              >
                {problem.status}
              </span>
            </p>
          </li>
        ))}
      </ul>

      {problems.length === 0 && !loading && (
        <p className="text-gray-600">ยังไม่มีปัญหาที่คุณแจ้ง</p>
      )}
    </div>
  );
};

export default Tracking;
