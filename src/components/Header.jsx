// src/components/Header.jsx
import React from 'react';
import '../App.css'; // or './Header.css'

function Header({ title }) {
  return (
    <header className="headerBar">
      <h1>{title}</h1>
    </header>
  );
}

export default Header;
