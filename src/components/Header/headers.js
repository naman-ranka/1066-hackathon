import React, { useState, useEffect } from 'react';
import './Header.css';
// Replace these with your actual image imports or paths
import logo from '../../assets/logo.png';
import avatar from '../../assets/avatar.png';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // You can adjust 50 to whatever scroll threshold you desire
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={isScrolled ? 'header scrolled' : 'header'}>
      {/* Logo on Left */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Middle Title */}
      <div className="title">SplitGuys</div>

      {/* Avatar on Right */}
      <div className="avatar-container">
        <img src={avatar} alt="User Avatar" className="avatar" />
      </div>
    </header>
  );
}

export default Header;