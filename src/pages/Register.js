import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = ({ users, setUsers }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = () => {
    if (!name || !email || !password || !confirm) {
      setError("عفاك عمّر جميع الحقول");
      return;
    }
    if (password !== confirm) {
      setError("تأكيد كلمة المرور مختلف");
      return;
    }

    setUsers([...users, { name, email, password }]);
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>تسجيل جديد</h2>
        {error && <div className="error">{error}</div>}

        <input placeholder="الاسم" value={name} onChange={(e)=>setName(e.target.value)} className="input"/>
        <input placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} className="input"/>
        <input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} className="input"/>
        <input type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="input"/>

        <button onClick={handleRegister} className="btn-save">تسجيل</button>

        <p style={{marginTop:'10px', textAlign:'center'}}>
          عندك حساب؟ <span style={{color:'#1e40af', cursor:'pointer'}} onClick={()=>navigate("/login")}>سجل الدخول</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
