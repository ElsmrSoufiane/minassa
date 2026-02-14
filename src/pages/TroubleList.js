import React, { useState } from "react";
import Navbar from "../components/Navbar";

const initialData = [
  {
    name: "Ahmed",
    phone: "0600000000",
    description: "رفض الاستلام أكثر من مرة"
  }
];

const PER_PAGE = 20;

const TroubleList = () => {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    description: ""
  });

  // search
  const filtered = data.filter(
    (u) =>
      u.phone.includes(search) ||
      u.description.includes(search)
  );

  // pagination
  const start = (page - 1) * PER_PAGE;
  const current = filtered.slice(start, start + PER_PAGE);
  const pages = Math.ceil(filtered.length / PER_PAGE);

  // add problem
  const handleAdd = () => {
    if (!form.name || !form.phone || !form.description) return;

    setData([{ ...form }, ...data]);
    setForm({ name: "", phone: "", description: "" });
    setPage(1);
  };

  return (
    <>
      <Navbar search={search} setSearch={setSearch} />

      <div className="content">

        {/* ADD PROBLEM */}
        <div className="add-box">
          <input
            placeholder="الاسم"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="رقم الهاتف"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="وصف المشكلة"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button onClick={handleAdd}>إضافة</button>
        </div>

        {/* RESULTS */}
        {current.map((u, i) => (
          <div key={i} className="card danger">
            <strong>{u.name}</strong> — {u.phone}
            <p>{u.description}</p>
          </div>
        ))}

        {/* PAGINATION */}
        {pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={page === n ? "active" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default TroubleList;
