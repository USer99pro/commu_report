import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";  // เพิ่ม
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../config/SupabaseClient";

const bucketName = "problems"; // bucket สำหรับรูป

const LocationPicker = ({ gps, setGps }) => {
  useMapEvents({
    click(e) {
      setGps({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return (
    <Marker
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setGps({ lat, lng });
        },
      }}
      position={[gps.lat, gps.lng]}
    >
      <Popup>ตำแหน่งที่เลือก</Popup>
    </Marker>
  );
};

const Report = () => {
  const navigate = useNavigate(); // เพิ่ม
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState({ lat: 13.7563, lng: 100.5018 });

  // ✅ เช็ค user ก่อน render หน้า
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        // ไม่มี user → ส่งไปหน้า login
        navigate("/register"); // เปลี่ยน path เป็นของคุณเอง
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          alert("ไม่สามารถดึงพิกัดได้: " + err.message);
        }
      );
    } else {
      alert("เบราว์เซอร์ของคุณไม่รองรับ GPS");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) return alert("กรุณากรอกข้อมูลให้ครบ");

    setLoading(true);

    let imageUrl = null;

    // อัพโหลดรูปไป Supabase Storage
    if (image) {
      const ext = image.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, image);

      if (uploadError) {
        console.error(uploadError);
        alert("อัพโหลดรูปไม่สำเร็จ");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // ดึง user ปัจจุบันอีกครั้งเพื่อ insert
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      alert("กรุณาเข้าสู่ระบบก่อนแจ้งปัญหา");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("problems").insert([
      {
        title,
        description,
        image_url: imageUrl,
        latitude: gps.lat,
        longitude: gps.lng,
        user_id: user.id,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } else {
      alert("ส่งปัญหาเรียบร้อยแล้ว");
      setTitle("");
      setDescription("");
      setImage(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">แจ้งปัญหา</h2>

      {/* ฟอร์ม */}
      <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="หัวข้อ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="รายละเอียดปัญหา..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <div className="flex items-center space-x-2">
          <input
            type="text"
            className="border p-2 rounded w-1/2"
            placeholder="Latitude"
            value={gps.lat}
            readOnly
          />
          <input
            type="text"
            className="border p-2 rounded w-1/2"
            placeholder="Longitude"
            value={gps.lng}
            readOnly
          />
          <button
            type="button"
            className="bg-gray-600 text-white px-2 py-1 rounded"
            onClick={handleGetLocation}
          >
            ดึง GPS
          </button>
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "กำลังส่ง..." : "ส่งปัญหา"}
        </button>
      </form>

      {/* แผนที่ */}
      <div style={{ height: "400px" }}>
        <MapContainer
          center={[gps.lat, gps.lng]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <LocationPicker gps={gps} setGps={setGps} />
        </MapContainer>
      </div>
    </div>
  );
};

export default Report;
