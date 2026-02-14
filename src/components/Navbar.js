import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/style.css";

const Navbar = ({ currentUser, setCurrentUser, search, setSearch }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "");

  const handleLogout = () => {
    if (setCurrentUser) setCurrentUser(null);
    setOpen(false);
    navigate("/");
  };

  return (
    <div className="top-navbar">
      <div className="logo" onClick={() => navigate("/")}>
        🔧 COD Intelligence
      </div>

      {setSearch && (
        <input
          className="search-input"
          placeholder="ابحث برقم الهاتف أو وصف المشكل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      <div className="navbar-controls">
        {/* زر عرض الخريطة */}
        <button 
          className="nav-btn map-btn"
          onClick={() => navigate("/map")}
          title="عرض الخريطة"
        >
          🗺️ الخريطة
        </button>

        {currentUser ? (
          <div className="avatar-wrapper">
            <div
              className="user-avatar"
              title={currentUser.name}
              onClick={() => setOpen(!open)}
            >
              {getInitial(currentUser.name)}
            </div>

            {open && (
              <div className="avatar-dropdown">
                <div className="dropdown-name">{currentUser.name}</div>
                <button onClick={handleLogout} className="logout-btn">
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <button 
              className="btn-outline" 
              onClick={() => navigate("/login")}
            >
              تسجيل الدخول
            </button>
            <button 
              className="btn-primary" 
              onClick={() => navigate("/register")}
            >
              حساب جديد
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;