import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// أضف هذه الأنماط للعناصر الموجودة
const AddProblem = ({ data, setData, currentUser, setCurrentUser }) => {
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium"); // أضف هذه الحالة
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSave = () => {
    if (!phone || !description) {
      setError("ضروري تملا جميع الحقول!");
      return;
    }

    setData([
      {
        phone,
        description,
        name: currentUser.name,
        status: "open",
        priority, // أضف الأولوية
        date: new Date().toLocaleDateString(),
        id: Date.now()
      },
      ...data,
    ]);

    setSuccess("تم إضافة المشكل بنجاح!");
    setPhone("");
    setDescription("");
    
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  return (
    <>
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        showSearch={false}
      />

      {/* أضف زر العودة */}
      <button className="back-button" onClick={() => navigate("/")}>
        الرجوع
      </button>

      <div className="add-page-container">
        <div className="add-card">
          <h2>إضافة مشكل جديد</h2>
          
          {error && <div className="validation-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="form-group">
            <label>رقم الهاتف</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06xxxxxxxx"
              type="tel"
            />
          </div>

          <div className="form-group">
            <label>وصف المشكل</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مفصّل للمشكل..."
            />
          </div>

          <div className="form-group">
            <label>الأولوية</label>
            <div className="priority-selector">
              {['low', 'medium', 'high'].map((level) => (
                <div
                  key={level}
                  className={`priority-option ${priority === level ? 'selected' : ''}`}
                  onClick={() => setPriority(level)}
                >
                  <div className={`priority-indicator priority-${level}`}></div>
                  <span className="priority-label">
                    {level === 'low' ? 'منخفضة' : level === 'medium' ? 'متوسطة' : 'عالية'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-submit" onClick={handleSave}>
            حفظ المشكل
          </button>
        </div>
      </div>
    </>
  );
};

export default AddProblem;