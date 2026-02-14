import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ users, setCurrentUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      setError("البريد أو كلمة المرور غير صحيحة");
      return;
    }
    setCurrentUser(user);
    navigate("/"); // Home
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>تسجيل الدخول</h2>
        {error && <div className="error">{error}</div>}

        <input placeholder="البريد الإلكتروني" value={email} onChange={(e)=>setEmail(e.target.value)} className="input"/>
        <input type="password" placeholder="كلمة المرور" value={password} onChange={(e)=>setPassword(e.target.value)} className="input"/>

        <button onClick={handleLogin} className="btn-save">تسجيل الدخول</button>

        <p style={{marginTop:'10px', textAlign:'center'}}>
          ما عندكش حساب؟ <span style={{color:'#1e40af', cursor:'pointer'}} onClick={()=>navigate("/register")}>سجل دابا</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
