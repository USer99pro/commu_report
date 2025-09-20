import { useEffect, useState, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../config/SupabaseClient";
import { useNavigate } from "react-router-dom";

const COLORS = ["#FFBB28", "#0088FE", "#00C49F"];
const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  resolved: "เสร็จสิ้น",
};
const STATUS_COLOR = {
  pending: "bg-orange-100 text-orange-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
};

const Dashboard = ({ problemId }) => {
  const [problems, setProblems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const problemsRef = useRef(null);
  const navigate = useNavigate();

  const fetchProblems = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("problems")
        .select("id, title, description, status, created_at")
        .order("created_at", { ascending: false });

      if (problemId) query = query.eq("id", problemId);

      const { data, error } = await query;
      if (error) throw error;

      setProblems(data || []);

      const counts = (data || []).reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
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
  }, [problemId]);

  const handleClickSlice = (entry) => {
    setSelectedStatus(entry.status);
    setTimeout(() => {
      problemsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleStatusChange = async (id, status) => {
    try {
      const { error } = await supabase.from("problems").update({ status }).eq("id", id);
      if (error) throw error;
      setProblems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      fetchProblems();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProblems = selectedStatus
    ? problems.filter((p) => p.status === selectedStatus)
    : [];

  const displayedProblems = filteredProblems.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (p.title || "").toLowerCase().includes(s) || (p.description || "").toLowerCase().includes(s);
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <button
          onClick={() => navigate("/admin/problems-status")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          จัดการสถานะปัญหา
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-200"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pie Chart */}
          <div className="w-full h-[320px] bg-white rounded-lg shadow-md p-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={selectedStatus ? 110 : 100}
                  label
                  dataKey="value"
                  onClick={handleClickSlice}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Problems Table */}
          {selectedStatus && (
            <div ref={problemsRef} className="overflow-x-auto bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{`รายการปัญหา: ${STATUS_LABELS[selectedStatus]}`}</h2>
                <div className="w-[400px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อหรือคำอธิบาย"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-2 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      🔍
                    </div>
                  </div>
                </div>
              </div>

              {displayedProblems.length === 0 ? (
                <p className="text-gray-500">ไม่มีปัญหาสถานะนี้</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-teal-500 text-white">
                    <tr>
                      <th className="px-4 py-2 text-center">ชื่อปัญหา</th>
                      <th className="px-4 py-2 text-center">คำอธิบาย</th>
                      <th className="px-4 py-2 text-center">สถานะ</th>
                      <th className="px-4 py-2 text-center">วันที่แจ้ง</th>
                      <th className="px-4 py-2 text-center">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedProblems.map((p) => (
                      <tr key={p.id} className="even:bg-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 text-center">{p.title}</td>
                        <td className="px-4 py-2 text-center">{p.description}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLOR[p.status]}`}>
                            {STATUS_LABELS[p.status]}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">{new Date(p.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 text-center flex justify-center gap-2 flex-wrap">
                          <button
                            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                            onClick={() => setSelectedProblem(p)}
                          >
                            รายละเอียด
                          </button>
                          {p.status === "pending" && (
                            <button
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                              onClick={() => handleStatusChange(p.id, "in_progress")}
                            >
                              Approve
                            </button>
                          )}
                          {p.status !== "resolved" && (
                            <button
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              onClick={() => handleStatusChange(p.id, "resolved")}
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-yellow-100 rounded-lg shadow-lg max-w-xl w-full p-6 animate-slide-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-yellow-800">รายละเอียดปัญหา</h3>
              <button
                onClick={() => setSelectedProblem(null)}
                className="text-yellow-800 font-bold text-xl"
              >
                ×
              </button>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 shadow">
              <h4 className="text-md font-semibold mb-2 text-yellow-800">{selectedProblem.title}</h4>
              <span className={`px-2 py-1 rounded-full text-xs mb-3 inline-block ${STATUS_COLOR[selectedProblem.status]}`}>
                {STATUS_LABELS[selectedProblem.status]}
              </span>
              <p className="mb-4 text-gray-700 whitespace-pre-wrap">{selectedProblem.description}</p>
              <p className="text-sm text-gray-500">วันที่แจ้ง: {new Date(selectedProblem.created_at).toLocaleString()}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                onClick={() => setSelectedProblem(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
