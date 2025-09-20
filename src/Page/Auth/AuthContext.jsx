import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../config/SupabaseClient"; // ที่คุณตั้งค่าไว้

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // ข้อมูล user supabase
  const [role, setRole] = useState(null);       // role ของ user
  const [loading, setLoading] = useState(true); // โหลดตอนเริ่ม

  useEffect(() => {
    // 1. โหลด session ปัจจุบัน
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser(data.session.user);
        // ถ้า role เก็บใน user_metadata
        setRole(data.session.user.user_metadata?.role || "user");
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    // 2. subscribe เวลา login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          setRole(session.user.user_metadata?.role || "user");
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
