import { useEffect, useState } from "react";
import { supabase } from "../../config/SupabaseClient";
import { useNavigate } from "react-router-dom";

const AuthMiddleware = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // ดึง session ปัจจุบัน
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          // ถ้าไม่มี session ให้ไปหน้า login/register
          navigate("/register");
          return;
        }

        const user = session.user;

        // ดึง role จาก custom claim (supabase มักจะอยู่ใน user.user_metadata หรือ user.app_metadata)
        const role = user?.app_metadata?.role || user?.user_metadata?.role;

        if (role !== "admin") {
          alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
          navigate("/"); // redirect ไปหน้า home
          return;
        }

        setLoading(false); // ผ่านทุกขั้นตอน ใช้งานหน้า admin ได้
      } catch (err) {
        console.error("Auth check error:", err);
        navigate("/register");
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-b-4 border-gray-200"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthMiddleware;
