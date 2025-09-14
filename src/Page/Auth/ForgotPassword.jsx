import { useState } from "react";
import { supabase } from "../../config/SupabaseClient"; // ไฟล์ config ที่คุณเชื่อม Supabase ไว้

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password", 
      // หรือ domain จริง เช่น https://your-domain.com/reset-password
    });

    if (error) {
      setMessage("❌ เกิดข้อผิดพลาด: " + error.message);
    } else {
      setMessage("✅ ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">ลืมรหัสผ่าน</h2>
        <form className="space-y-4" onSubmit={handleForgotPassword}>
          <div>
            <label className="block mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </button>
        </form>
        {message && (
          <p className="text-center mt-4 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
