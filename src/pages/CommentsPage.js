import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // أضف useNavigate هنا
import Navbar from "../components/Navbar";

const CommentsPage = ({ data, setData, currentUser, setCurrentUser }) => {
  const { phone } = useParams();
  const [text, setText] = useState("");
  const [commentStatus, setCommentStatus] = useState("open");
  const navigate = useNavigate(); // الآن ستعمل

  const comments = data.filter((d) => d.phone === phone);

  const addComment = () => {
    if (!text.trim()) return;

    const newComment = {
      phone,
      description: text,
      name: currentUser.name,
      status: commentStatus,
      date: new Date().toLocaleString(),
      id: Date.now()
    };

    setData([...data, newComment]);
    setText("");
  };

  return (
    <>
      <Navbar
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        showSearch={false}
      />

      <button className="back-button" onClick={() => navigate("/")}>
        الرجوع للقائمة
      </button>

      <div className="comments-page">
        <div className="comments-header">
          <h1>مشاكل الرقم {phone}</h1>
          <div className="comment-count">
            {comments.length} {comments.length === 1 ? 'مشكل' : 'مشاكل'}
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <h3>ماكاينش مشاكل لهاد الرقم</h3>
            <p>كن أول واحد يضيف مشكل لهذا الرقم</p>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((c, i) => (
              <div key={i} className="comment-block">
                <div className="comment-header">
                  <div className="comment-author">{c.name}</div>
                  <div className="comment-date">{c.date || "اليوم"}</div>
                </div>
                <div className="comment-text">{c.description}</div>
                <div className={`comment-status ${c.status}`}>
                  {c.status === "open" ? "مفتوح 🟡" : "محلول 🟢"}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentUser && (
          <div className="add-comment">
            <h3>زيد تعليق جديد</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="كتب وصف المشكل هنا..."
            />
            
            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>حالة المشكل</label>
              <select 
                className="select" 
                value={commentStatus}
                onChange={(e) => setCommentStatus(e.target.value)}
              >
                <option value="open">مفتوح</option>
                <option value="solved">محلول</option>
              </select>
            </div>
            
            <div className="button-group">
              <button onClick={addComment}>إضافة المشكل</button>
              <button className="cancel" onClick={() => setText("")}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CommentsPage;