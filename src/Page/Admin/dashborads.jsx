import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../config/SupabaseClient";
import { useNavigate } from "react-router-dom"; // ใช้ react-router สำหรับ navigation

const COLORS = ["#FFBB28", "#0088FE", "#00C49F"]; // pending, in_progress, resolved
const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  resolved: "เสร็จสิ้น",
};

const Dashboard = () => {
  const [problems, setProblems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const navigate = useNavigate(); // สำหรับ navigate

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("problems")
        .select("id, title, description, status, user_id, created_at");

      if (error) throw error;

      setProblems(data || []);

      const counts = data.reduce(
        (acc, p) => {
          if (p.status === "pending") acc.pending += 1;
          else if (p.status === "in_progress") acc.in_progress += 1;
          else if (p.status === "resolved") acc.resolved += 1;
          return acc;
        },
        { pending: 0, in_progress: 0, resolved: 0 }
      );

      setChartData([
        { name: STATUS_LABELS.pending, value: counts.pending, status: "pending" },
        { name: STATUS_LABELS.in_progress, value: counts.in_progress, status: "in_progress" },
        { name: STATUS_LABELS.resolved, value: counts.resolved, status: "resolved" },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleClickSlice = (entry) => {
    setSelectedStatus(entry.status);
  };

  const filteredProblems = selectedStatus
    ? problems.filter((p) => p.status === selectedStatus)
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* ปุ่มไปหน้าเปลี่ยนสถานะ */}
      <button
        onClick={() => navigate("/admin/problems-status")}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        จัดการสถานะปัญหา
      </button>

      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <>
          <div className="w-full h-64 mb-6">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                  dataKey="value"
                  onClick={handleClickSlice}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {selectedStatus && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                รายการปัญหา: {STATUS_LABELS[selectedStatus]}
              </h2>
              {filteredProblems.length === 0 ? (
                <p className="text-gray-600">ไม่มีปัญหาสถานะนี้</p>
              ) : (
                <ul className="space-y-4">
                  {filteredProblems.map((p) => (
                    <li
                      key={p.id}
                      className="p-4 border rounded shadow bg-white"
                    >
                      <h3 className="font-semibold">{p.title}</h3>
                      <p>{p.description}</p>
                      <p className="text-sm text-gray-500">
                        User ID: {p.user_id} | วันที่แจ้ง:{" "}
                        {new Date(p.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
