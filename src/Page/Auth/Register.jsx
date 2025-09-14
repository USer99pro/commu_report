import { useState } from "react";
import { supabase } from "../../config/SupabaseClient";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // --- fetch profile (RLS filter ให้แล้ว)
  const fetchProfile = async () => {
    const { data, error } = await supabase.from("profiles").select("*").single();
    if (error) throw error;
    setProfile(data);
  };

  // --- upload avatar
  const uploadAvatar = async (file, userId) => {
    if (!file) return null;
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${userId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("Image")
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("Image")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // update profile (RLS check = auth.uid() = id)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);
    if (updateError) throw updateError;

    return publicUrl;
  };

  // --- register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password !== confirm) throw new Error("รหัสผ่านไม่ตรงกัน");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: identifier,
        password,
      });
      if (signUpError) throw signUpError;
      const user = data.user;
      if (!user) throw new Error("ไม่สามารถสร้างผู้ใช้ได้");

      // insert profile (id ต้องตรงกับ auth.uid())
      const { error: insertError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          full_name: fullName,
          phone,
          address,
          email: identifier,
        },
      ]);
      if (insertError) throw insertError;

      if (file) {
        // ✅ แก้ลำดับ argument (file ก่อน userId)
        await uploadAvatar(file, user.id);
      }

      await fetchProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      if (signInError) throw signInError;

      await fetchProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md">
        {!profile ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">
              {isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </h2>

            <form
              className="space-y-4"
              onSubmit={isRegister ? handleRegister : handleLogin}
            >
              {isRegister && (
                <>
                  <input
                    type="text"
                    placeholder="ชื่อ-นามสกุล"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="เบอร์โทร"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <textarea
                    placeholder="ที่อยู่"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  ></textarea>
                  <input
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </>
              )}

              <input
                type="text"
                placeholder="อีเมล"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading
                  ? "กำลังประมวลผล..."
                  : isRegister
                  ? "สมัครสมาชิก"
                  : "เข้าสู่ระบบ"}
              </button>

              {isRegister && (
                <div className="mt-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full"
                  />
                </div>
              )}
            </form>

            <div className="text-center mt-4">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-blue-600 hover:underline text-sm"
              >
                {isRegister
                  ? "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"
                  : "ยังไม่มีบัญชี? สมัครสมาชิก"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h2>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-24 h-24 rounded-full mx-auto mb-4"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                ไม่มีรูป
              </div>
            )}
            <p>
              <strong>ชื่อ:</strong> {profile.full_name}
            </p>
            <p>
              <strong>อีเมล:</strong> {profile.email}
            </p>
            <p>
              <strong>เบอร์โทร:</strong> {profile.phone}
            </p>
            <p>
              <strong>ที่อยู่:</strong> {profile.address}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
