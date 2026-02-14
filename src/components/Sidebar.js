import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>COD Intelligence</h2>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/problems">Problems</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
