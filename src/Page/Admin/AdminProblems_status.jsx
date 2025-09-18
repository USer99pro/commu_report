// AdminProblemsStatus.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../config/SupabaseClient";

const AdminProblemsStatus = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProblems = async () => {
    setLoading(true);

    // ดึงปัญหา
    const { data: problemsData, error: problemsError } = await supabase
      .from("problems")
      .select("id, title, description, status, created_at, user_id")
      .order("created_at", { ascending: false });

    if (problemsError) {
      console.error(problemsError);
      setLoading(false);
      return;
    }

    // ดึง profiles (public table ของคุณ)
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email");

    if (profilesError) {
      console.error(profilesError);
      setLoading(false);
      return;
    }

    // รวมปัญหากับชื่อ user
    const merged = problemsData.map((p) => {
      const user = profilesData.find((u) => u.id === p.user_id);
      return {
        ...p,
        user_name: user?.full_name || "ไม่ระบุ",
        user_email: user?.email || "-",
      };
    });

    setProblems(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // เปลี่ยนสถานะ
  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from("problems")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("เปลี่ยนสถานะไม่สำเร็จ");
    } else {
      fetchProblems();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการสถานะปัญหา (Admin)</h1>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : problems.length === 0 ? (
        <p>ไม่มีปัญหา</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Title</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">User</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p.id} className="hover:bg-gray-100">
                <td className="border p-2">{p.title}</td>
                <td className="border p-2">{p.description}</td>
                <td className="border p-2">
                  <div>
                    <p className="font-semibold">{p.user_name}</p>
                    <p className="text-xs text-gray-500">{p.user_email}</p>
                  </div>
                </td>
                <td className="border p-2">
                  {new Date(p.created_at).toLocaleString()}
                </td>
                <td className="border p-2">
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
                    className="border p-1 rounded"
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="resolved">เสร็จสิ้น</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminProblemsStatus;
