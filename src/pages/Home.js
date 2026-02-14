import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Rating from "../components/Rating";
import "../assets/css/style.css";

const PER_PAGE = 20;

const Home = ({ data, currentUser, setCurrentUser, updateRating }) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  // تجميع البيانات حسب الرقم
  const phoneGroups = {};
  data.forEach(item => {
    if (!phoneGroups[item.phone]) {
      phoneGroups[item.phone] = {
        phone: item.phone,
        count: 0,
        lastDate: "",
        status: "open",
        rating: item.rating || 0,
        ratingCount: item.ratingCount || 0,
        city: item.city || "غير محدد" // 🗺️ إضافة المدينة
      };
    }
    phoneGroups[item.phone].count++;
    phoneGroups[item.phone].lastDate = item.date || "";
  });

  const uniquePhones = Object.values(phoneGroups);

  // البحث
  const filtered = uniquePhones.filter(
    (u) =>
      u.phone.includes(search) ||
      u.city.includes(search) || // 🗺️ البحث حسب المدينة
      data
        .filter((d) => d.phone === u.phone)
        .some((d) => d.description.includes(search))
  );

  const start = (page - 1) * PER_PAGE;
  const current = filtered.slice(start, start + PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // دالة التعامل مع التقييم
  const handleRate = (phone, rating) => {
    if (!currentUser) {
      alert("يجب تسجيل الدخول لتقييم الرقم");
      navigate("/login");
      return;
    }
    updateRating(phone, rating);
  };

  return (
    <>
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <div className="content">
        {/* 🗺️ أزرار التحكم */}
        <div className="dashboard-controls">
          <button 
            className="dashboard-btn primary"
            onClick={() => navigate("/add")}
          >
            + إضافة مشكل جديد
          </button>
          
          <button 
            className="dashboard-btn secondary"
            onClick={() => navigate("/map")}
          >
            🗺️ عرض الخريطة
          </button>
        </div>

        {/* 🗺️ إحصائيات سريعة */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">📱</div>
            <div className="stat-info">
              <h3>{uniquePhones.length}</h3>
              <p>أرقام مشبوهة</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>{data.length}</h3>
              <p>مشاكل مسجلة</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{data.filter(d => d.status === 'solved').length}</h3>
              <p>تم حلها</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <h3>{data.filter(d => d.rating > 3).length}</h3>
              <p>مشاكل عالية الخطورة</p>
            </div>
          </div>
        </div>

        <div className="problems-grid">
          {current.map((item, i) => (
            <div
              key={i}
              className="card danger"
              onClick={() => navigate(`/comments/${item.phone}`)}
            >
              <div className="status-badge status-open">مفتوح</div>
              
              <div className="card-header">
                <div>
                  <div className="card-title">{item.phone}</div>
                  <div className="card-category">📍 {item.city}</div> {/* 🗺️ إضافة المدينة */}
                </div>
              </div>

              {/* ⭐ عرض التقييم */}
              <div className="card-rating">
                <Rating
                  phone={item.phone}
                  currentRating={item.rating || 0}
                  onRate={handleRate}
                  readOnly={!currentUser}
                />
                {item.ratingCount > 0 && (
                  <span className="rating-count">({item.ratingCount} تقييم)</span>
                )}
              </div>

              <div className="card-description">
                {item.count > 5 ? (
                  <span style={{color: '#ef4444', fontWeight: 'bold'}}>
                    ⚠️ تحذير: هذا الرقم لديه {item.count} مشاكل مسجلة
                  </span>
                ) : (
                  `هاد الرقم عندو ${item.count} مشاكل مسجلة من طرف المستخدمين.`
                )}
              </div>
              
              <div className="card-footer">
                <div className="card-date">
                  آخر تحديث: {item.lastDate || "اليوم"}
                </div>
                <div className="card-stats">
                  <div className="stat-item stat-comments">{item.count}</div>
                  <div className="stat-item stat-location">📍</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* الترقيم */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            السابق
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                className={page === pageNum ? "active" : ""}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            التالي
          </button>
        </div>
      )}

      {/* زر الإضافة العائم */}
      <div
        className="fab"
        onClick={() =>
          currentUser ? navigate("/add") : navigate("/register")
        }
        title="إضافة مشكل جديد"
      >
        +
      </div>
      
      {/* 🗺️ زر الخريطة العائم */}
      <div
        className="fab map-fab"
        onClick={() => navigate("/map")}
        title="عرض الخريطة"
        style={{ bottom: '100px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
      >
        🗺️
      </div>
    </>
  );
};

export default Home;