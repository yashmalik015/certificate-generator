import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
import StudentForm from './pages/StudentForm';
import Events from './pages/Events';
import Subjects from './pages/Subjects';
import PublicVerify from './pages/PublicVerify';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify/*" element={<PublicVerify />} />

        <Route path="/superpanel" element={<Layout />}>
          <Route index element={<Navigate to="/superpanel/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="students/create" element={<StudentForm />} />
          <Route path="students/:id/edit" element={<StudentForm />} />
          <Route path="events" element={<Events />} />
          <Route path="subjects" element={<Subjects />} />
        </Route>

        <Route path="*" element={<Navigate to="/superpanel/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
