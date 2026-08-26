import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, BookOpen, Award } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Award size={22} />
        </div>
        <div className="sidebar-title">WCAEO Panel</div>
      </div>
      <ul className="sidebar-menu">
        <li>
          <NavLink to="/superpanel/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/superpanel/students" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Users size={18} />
            <span>Students</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/superpanel/events" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Calendar size={18} />
            <span>Events</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/superpanel/subjects" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Subjects</span>
          </NavLink>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
