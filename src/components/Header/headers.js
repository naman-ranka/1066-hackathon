import React, { useState, useEffect } from 'react';
import './Header.css';
import logo from '../../assets/logo.png';
import avatar from '../../assets/avatar.png';
import ThemeToggle from '../ThemeToggle';
import { Box, IconButton, Menu, MenuItem, useMediaQuery, useTheme, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Menu as MenuIcon, AccountCircle, Settings, Help, Logout } from '@mui/icons-material';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={isScrolled ? 'header scrolled' : 'header'}>
      {isMobile && (
        <IconButton 
          color="inherit" 
          aria-label="open drawer" 
          onClick={toggleMobileMenu}
          className="mobile-menu-button"
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Logo on Left */}
      <div className="logo-container">
        <img src={logo} alt="Logo" className="logo" />
      </div>

      {/* Middle Title - Hide on very small screens */}
      <div className={`title ${isMobile ? 'mobile-title' : ''}`}>
        {!isMobile && 'SplitGuys'}
      </div>

      {/* Right side controls */}
      <Box className="controls-container">
        <ThemeToggle />
        
        <div className="avatar-container">
          <img 
            src={avatar} 
            alt="User Avatar" 
            className="avatar" 
            onClick={handleMenuClick}
          />
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>My Bills</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
          </Menu>
        </div>
      </Box>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleMobileMenu}
          onKeyDown={toggleMobileMenu}
        >
          <List>
            <ListItem>
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', p: 2 }}>
                <img src={logo} alt="Logo" style={{ height: '40px' }} />
              </Box>
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem button>
              <ListItemIcon>
                <Help />
              </ListItemIcon>
              <ListItemText primary="Help" />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </header>
  );
}

export default Header;