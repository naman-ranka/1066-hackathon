import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import routing components
import App from './App'; // Your main app component (if you have one)
import TaskList from './components/taskList'; // Your TaskList component
import './index.css'; // Your global styles

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* Wrap your entire app with Router */}
      <Routes> {/* Define your routes */}
        <Route path="/" element={<App />} /> {/* Default route (optional) */}
        <Route path="/tasks" element={<TaskList />} /> {/* Route for your tasks page */}
        {/* Add other routes here, e.g., for your bill splitting components */}
      </Routes>
    </Router>
  </React.StrictMode>
);