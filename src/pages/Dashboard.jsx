import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, BookOpen, Award, UserPlus, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/axiosClient';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalEvents: 0,
    totalSubjects: 0,
    certificatesCount: 0
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, eventsRes, subjectsRes] = await Promise.all([
        api.get('/students?perPage=5'),
        api.get('/events'),
        api.get('/subjects')
      ]);

      const studentsData = studentsRes.data.data || [];
      const totalStudents = studentsRes.data.pagination?.total || studentsData.length;

      let certCount = 0;
      studentsData.forEach(s => {
        certCount += (s.certificateTemplateIds?.length || 1);
      });

      setStats({
        totalStudents,
        totalEvents: eventsRes.data.length || 0,
        totalSubjects: subjectsRes.data.length || 0,
        certificatesCount: certCount
      });

      setRecentStudents(studentsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon students">
            <Users size={26} />
          </div>
          <div>
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Total Recipients</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon events">
            <Calendar size={26} />
          </div>
          <div>
            <div className="stat-number">{stats.totalEvents}</div>
            <div className="stat-label">Active Events</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon subjects">
            <BookOpen size={26} />
          </div>
          <div>
            <div className="stat-number">{stats.totalSubjects}</div>
            <div className="stat-label">Configured Subjects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon certificates">
            <Award size={26} />
          </div>
          <div>
            <div className="stat-number">{stats.certificatesCount}</div>
            <div className="stat-label">Certificates Issued</div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #131b2e)', border: '1px solid var(--primary-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: '#ffffff' }}>
              Issue New WCAEO Award Certificate
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Create recipient records, auto-fill reference numbers, overlay dynamic award details, and generate print-ready PDFs.
            </p>
          </div>
          <Link to="/superpanel/students/create" className="btn btn-primary">
            <UserPlus size={18} /> + New Students
          </Link>
        </div>
      </div>

      {/* Recent Students Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recently Issued Certificates</h3>
          <Link to="/superpanel/students" className="btn btn-outline btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent records...</div>
        ) : recentStudents.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No student records found.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Refno</th>
                  <th>Recipient Name</th>
                  <th>Category</th>
                  <th>Certificates Assigned</th>
                  <th>Status</th>
                  <th>Mail Sent</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s) => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>{s.refno}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.email || 'No email'}</div>
                    </td>
                    <td>{s.category}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {s.certificateTemplateIds?.map((t, idx) => (
                          <span key={idx} style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            {t.replace(/[-_]/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.mailSent ? 'badge-mail-sent' : 'badge-mail-pending'}`}>
                        {s.mailSent ? <><CheckCircle2 size={12} /> Yes</> : <><Clock size={12} /> Pending</>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
