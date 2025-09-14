import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "กำลังดำเนินการ", value: 8 },
  { name: "เสร็จสิ้น", value: 12 },
  { name: "รอดำเนินการ", value: 5 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="w-full h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={80} label>
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
