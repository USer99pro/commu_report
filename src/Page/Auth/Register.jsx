import { useState, useEffect } from "react";
import { supabase } from "../../config/SupabaseClient";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- fetch profile
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error) setProfile(data);
  };

  // --- upload avatar (File หรือ URL)
  const uploadAvatar = async (userId, fileOrUrl) => {
    try {
      let blob;
      let ext;

      if (fileOrUrl instanceof File) {
        blob = fileOrUrl;
        ext = fileOrUrl.name.split(".").pop();
      } else {
        // เป็น URL (GitHub)
        const response = await fetch(fileOrUrl);
        blob = await response.blob();
        ext = fileOrUrl.split(".").pop().split("?")[0];
      }

      const fileName = `${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { upsert: true });
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(fileName).data.publicUrl;
      return publicUrl;
    } catch (err) {
      console.log("Avatar upload failed:", err.message);
      return null;
    }
  };

  // --- create profile
  const createProfile = async (user, options = {}) => {
    const { full_name, phone, address, avatarFile } = options;

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    let avatar_url = null;

    if (avatarFile) {
      avatar_url = await uploadAvatar(user.id, avatarFile);
    } else if (user.user_metadata?.avatar_url) {
      avatar_url = await uploadAvatar(user.id, user.user_metadata.avatar_url);
    }

    if (!existing) {
      await supabase.from("profiles").insert([{
        id: user.id,
        full_name: full_name || user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email,
        phone: phone || "",
        address: address || "",
        avatar_url
      }]);
    }

    await fetchProfile(user.id);
  };

  // --- Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      await createProfile(authData.user, { full_name: fullName, phone, address, avatarFile });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      await fetchProfile(authData.user.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- GitHub OAuth
  const handleGitHubLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: "https://ilukneyovjxqpqrjczjy.supabase.co/auth/v1/callback",
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // --- Auth listener
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await createProfile(session.user);
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) createProfile(session.user);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // --- render profile
  if (profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md text-center">
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
          <p><strong>ชื่อ:</strong> {profile.full_name}</p>
          <p><strong>อีเมล:</strong> {profile.email}</p>
          <p><strong>เบอร์โทร:</strong> {profile.phone}</p>
          <p><strong>ที่อยู่:</strong> {profile.address}</p>
          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    );
  }

  // --- render form
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-6">{isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="ชื่อ-นามสกุล"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="เบอร์โทร"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="ที่อยู่"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                className="w-full p-2 border rounded"
              />
            </>
          )}
          <input
            type="email"
            placeholder="อีเมล"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          {isRegister && (
            <input
              type="password"
              placeholder="ยืนยันรหัสผ่าน"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "กำลังทำงาน..." : isRegister ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="my-4">หรือ</p>
        <button
          onClick={handleGitHubLogin}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย GitHub"}
        </button>

        <p className="mt-4 text-sm">
          {isRegister ? "มีบัญชีแล้ว?" : "ยังไม่มีบัญชี?"}{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </span>
        </p>
      </div>
    </div>
  );
}
