import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "../../config/SupabaseClient";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Button,
  Spinner,
  Text,
  Stack,
  Card,
  CardBody,
  Divider,
} from "@chakra-ui/react";

const COLORS = ["#FFBB28", "#0088FE", "#00C49F"];
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
  const navigate = useNavigate();

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
    <Box p={8} bg="gray.50" minH="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">📊 Admin Dashboard</Heading>
        <Button colorScheme="blue" onClick={() => navigate("/admin/problems-status")}>
          จัดการสถานะปัญหา
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Stack spacing={8}>
          {/* Pie Chart */}
          <Box w="100%" h="300px" bg="white" borderRadius="lg" shadow="md" p={4}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  dataKey="value"
                  onClick={handleClickSlice}
                  cursor="pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Filtered Problems List */}
          {selectedStatus && (
            <Box>
              <Heading size="md" mb={4}>
                รายการปัญหา: {STATUS_LABELS[selectedStatus]}
              </Heading>
              {filteredProblems.length === 0 ? (
                <Text color="gray.500">ไม่มีปัญหาสถานะนี้</Text>
              ) : (
                <Stack spacing={4}>
                  {filteredProblems.map((p) => (
                    <Card key={p.id} shadow="sm" borderWidth="1px">
                      <CardBody>
                        <Heading size="sm" mb={2}>{p.title}</Heading>
                        <Text mb={2}>{p.description}</Text>
                        <Divider my={2} />
                        <Text fontSize="sm" color="gray.500">
                          User ID: {p.user_id} | วันที่แจ้ง:{" "}
                          {new Date(p.created_at).toLocaleString()}
                        </Text>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default Dashboard;
