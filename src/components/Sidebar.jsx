// src/components/Sidebar.jsx
import React from 'react';
import '../App.css'; // or import './Sidebar.css'; if you have separate CSS

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logoSymbol">$</div>
      </div>
      <nav className="nav">
        <a href="#home" className="navLink">Home</a>
        <a href="#bills" className="navLink">Bills</a>
        <a href="#settings" className="navLink">Settings</a>
        <a href="#chat" className="navLink">Chat</a>
        <a href="#info" className="navLink">Info</a>
      </nav>
    </aside>
  );
}

export default Sidebar;
