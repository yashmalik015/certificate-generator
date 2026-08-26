import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Edit2, Trash2, Mail, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, page: 1, perPage: 10, totalPages: 1 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [sendingMailId, setSendingMailId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [page, perPage, search, statusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = `/students?page=${page}&perPage=${perPage}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await api.get(url);
      setStudents(res.data.data || []);
      setPagination(res.data.pagination || { total: 0, page: 1, perPage: 10, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch students list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(students.map((s) => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete certificate record for ${name}?`)) {
      return;
    }
    try {
      await api.delete(`/students/${id}`);
      setActionMessage({ type: 'success', text: `Deleted student record for ${name}.` });
      fetchStudents();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to delete student record.' });
    }
  };

  const handleSendMail = async (student) => {
    if (!student.email) {
      setActionMessage({ type: 'error', text: 'Recipient has no email address configured.' });
      return;
    }
    setSendingMailId(student._id);
    try {
      const res = await api.post(`/students/${student._id}/send-mail`);
      setActionMessage({ type: 'success', text: res.data.message || `Mail successfully sent to ${student.email}` });
      fetchStudents();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.error || 'Failed to send certificate email.' });
    } finally {
      setSendingMailId(null);
    }
  };

  const handleDownloadCert = (studentId, templateId) => {
    const token = localStorage.getItem('wcaeo_token');
    const downloadUrl = `/api/students/${studentId}/certificate/${encodeURIComponent(templateId)}/download?token=${token}&format=pdf`;
    window.open(downloadUrl, '_blank');
  };

  // Format short button label for award template name
  const getShortTemplateLabel = (templateId) => {
    const lower = templateId.toLowerCase();
    if (lower.includes('padm') || lower.includes('padam')) return 'Padam';
    if (lower.includes('samaj') || lower.includes('seva')) return 'Samaj Seva';
    if (lower.includes('doctorate')) return 'Doctorate';
    if (lower.includes('business')) return 'Business';
    if (lower.includes('entrepreneur')) return 'Enterpreneur';
    if (lower.includes('literary')) return 'Literary';
    if (lower.includes('sahitya')) return 'Sahitya';
    if (lower.includes('shiksha') || lower.includes('principal')) return 'Shiksha';
    if (lower.includes('bibhuti')) return 'Bibhuti';
    if (lower.includes('laureate')) return 'Laureate';
    if (lower.includes('women') || lower.includes('icon')) return 'Women Icon';
    return templateId.substring(0, 10);
  };

  const startRecord = (pagination.page - 1) * pagination.perPage + 1;
  const endRecord = Math.min(pagination.page * pagination.perPage, pagination.total);

  return (
    <div>
      {actionMessage.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: actionMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionMessage.text}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }} onClick={() => setActionMessage({ type: '', text: '' })}>✕</button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="table-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name, refno, category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <button
              className={`btn btn-outline ${showFilters || statusFilter ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              style={{ position: 'relative' }}
            >
              <Filter size={16} /> Filter
              {statusFilter && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-accent)' }}></span>
              )}
            </button>

            {showFilters && (
              <select
                className="form-control"
                style={{ width: '150px' }}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            )}
          </div>

          <div className="toolbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>Per page:</span>
              <select
                className="form-control"
                style={{ width: '75px', padding: '6px' }}
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <Link to="/superpanel/students/create" className="btn btn-primary">
              <Plus size={16} /> New students
            </Link>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading students list...
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No recipient student records match your query.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={students.length > 0 && selectedIds.length === students.length}
                    />
                  </th>
                  <th>Refno</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Mail Sent</th>
                  <th>Certificates Download</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student._id)}
                        onChange={() => handleSelectOne(student._id)}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-accent)', whiteSpace: 'nowrap' }}>
                      {student.refno}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.fullName}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                          />
                        ) : (
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 600 }}>
                            {student.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{student.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{student.category}</td>
                    <td>
                      <span className={`badge ${student.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${student.mailSent ? 'badge-mail-sent' : 'badge-mail-pending'}`}>
                        {student.mailSent ? <><CheckCircle2 size={12} /> Yes</> : <><Clock size={12} /> Pending</>}
                      </span>
                    </td>
                    <td>
                      {/* One download button per certificate assigned */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {student.certificateTemplateIds?.map((tid) => (
                          <button
                            key={tid}
                            className="btn-cert-download"
                            onClick={() => handleDownloadCert(student._id, tid)}
                            title={`Download PDF for ${tid}`}
                          >
                            <Download size={12} /> {getShortTemplateLabel(tid)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleSendMail(student)}
                          disabled={sendingMailId === student._id}
                          title="Send Certificate via Email"
                        >
                          <Mail size={14} /> {sendingMailId === student._id ? 'Sending...' : 'Mail'}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/superpanel/students/${student._id}/edit`)}
                          title="Edit Student"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(student._id, student.fullName)}
                          title="Delete Student"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && pagination.total > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {startRecord} to {endRecord} of {pagination.total} results
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  className={`page-btn ${pNum === page ? 'active' : ''}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsList;
