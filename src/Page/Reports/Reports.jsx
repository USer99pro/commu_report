import { useState } from "react";
import { supabase } from "../../config/SupabaseClient";

const Report = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [gps, setGps] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
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
      const fileName = `${Date.now()}_${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("problems") // bucket ชื่อ "problems"
        .upload(fileName, image);

      if (uploadError) {
        console.error(uploadError);
        alert("อัพโหลดรูปไม่สำเร็จ");
        setLoading(false);
        return;
      }

      // ดึง public URL
      const { data: publicUrlData } = supabase.storage
        .from("problems")
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    // บันทึกลง table
    const { error } = await supabase.from("problems").insert([
      {
        title,
        description,
        image_url: imageUrl,
        latitude: gps.lat || null,
        longitude: gps.lng || null,
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
      setGps({ lat: "", lng: "" });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">แจ้งปัญหา</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
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
    </div>
  );
};

export default Report;
