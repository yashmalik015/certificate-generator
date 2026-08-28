import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const getPageTitle = (pathname) => {
  if (pathname.includes('/superpanel/dashboard')) return 'Dashboard';
  if (pathname.includes('/superpanel/students/create')) return 'Create Student Record';
  if (pathname.includes('/edit')) return 'Edit Student Record';
  if (pathname.includes('/superpanel/students')) return 'Students & Certificates';
  if (pathname.includes('/superpanel/events')) return 'Events Management';
  if (pathname.includes('/superpanel/subjects')) return 'Subjects Management';
  if (pathname.includes('/superpanel/designations')) return 'Designations Management';
  if (pathname.includes('/superpanel/template-calibrator')) return 'Template Calibrator';
  return 'IHREO Admin Superpanel';
};

const Layout = () => {
  const token = localStorage.getItem('wcaeo_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const title = getPageTitle(location.pathname);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header title={title} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
