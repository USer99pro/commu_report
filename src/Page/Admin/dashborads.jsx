import { useEffect, useState, useRef } from "react";
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
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

const COLORS = ["#FFBB28", "#0088FE", "#00C49F"];
const STATUS_LABELS = {
  pending: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  resolved: "เสร็จสิ้น",
};
const STATUS_BADGE_COLOR = {
  pending: "orange",
  in_progress: "blue",
  resolved: "green",
};

const Dashboard = ({ problemId }) => {
  const [problems, setProblems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const navigate = useNavigate();

  const problemsRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ฟังก์ชันดึงข้อมูลปัญหาเฉพาะ id
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("problems")
        .select("id, title, description, status, created_at")
        .order("created_at", { ascending: false });

      // ถ้ามี problemId ให้ filter
      if (problemId) {
        query.eq("id", problemId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProblems(data || []);

      // สร้าง chart
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

  const openDetail = (p) => {
    setSelectedProblem(p);
    onOpen();
  };

  return (
    <Box p={8} bg="gray.50" minH="100vh" maxW="1100px" mx="auto">
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
          <Box w="100%" h="320px" bg="white" borderRadius="lg" shadow="md" p={4}>
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
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                      stroke={entry.status === selectedStatus ? "black" : "none"}
                      strokeWidth={entry.status === selectedStatus ? 3 : 0}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Problems List */}
          {selectedStatus && (
            <Box ref={problemsRef} bg="white" p={4} borderRadius="lg" shadow="sm">
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">รายการปัญหา: {STATUS_LABELS[selectedStatus]}</Heading>
                <InputGroup w="400px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="ค้นหาชื่อหรือคำอธิบาย"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="sm"
                  />
                </InputGroup>
              </Flex>

              {displayedProblems.length === 0 ? (
                <Text color="gray.500">ไม่มีปัญหาสถานะนี้</Text>
              ) : (
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={4}>
                  {displayedProblems.map((p) => (
                    <Card
                      key={p.id}
                      bg={p.status === "pending" ? "orange.50" : p.status === "in_progress" ? "blue.50" : "green.50"}
                      borderWidth="1px"
                      borderColor={p.status === selectedStatus ? "blue.300" : "gray.200"}
                      boxShadow="sm"
                      _hover={{ transform: "translateY(-3px)", boxShadow: "md" }}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <Heading size="sm" mb={2} noOfLines={2}>{p.title}</Heading>
                        <Text noOfLines={3} mb={3}>{p.description}</Text>

                        <Flex align="center" justify="space-between" mb={2}>
                          <Badge colorScheme={STATUS_BADGE_COLOR[p.status]}>
                            {STATUS_LABELS[p.status]}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            แจ้ง: {new Date(p.created_at).toLocaleString()}
                          </Text>
                        </Flex>

                        <Flex justify="space-between" flexWrap="wrap" gap={2}>
                          {p.status === "pending" && (
                            <Button size="sm" colorScheme="blue" onClick={() => handleStatusChange(p.id, "in_progress")}>
                              Approve
                            </Button>
                          )}
                          {p.status !== "resolved" && (
                            <Button size="sm" colorScheme="green" onClick={() => handleStatusChange(p.id, "resolved")}>
                              Resolve
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openDetail(p)}>
                            ดูรายละเอียด
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Stack>
      )}

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={() => { setSelectedProblem(null); onClose(); }} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>รายละเอียดปัญหา</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProblem && (
              <>
                <Heading size="sm" mb={2}>{selectedProblem.title}</Heading>
                <Badge mb={3} colorScheme={STATUS_BADGE_COLOR[selectedProblem.status]}>
                  {STATUS_LABELS[selectedProblem.status]}
                </Badge>
                <Text mb={4} whiteSpace="pre-wrap">{selectedProblem.description}</Text>
                <Divider mb={3} />
                <Text fontSize="sm" color="gray.500">
                  วันที่แจ้ง: {new Date(selectedProblem.created_at).toLocaleString()}
                </Text>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => { setSelectedProblem(null); onClose(); }}>
              ปิด
            </Button>
            <Button colorScheme="blue" onClick={onClose}>ทำต่อ</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Dashboard;
