import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import api from '../api/axiosClient';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, { name });
        setSuccess('Subject updated successfully.');
      } else {
        await api.post('/subjects', { name });
        setSuccess('Subject created successfully.');
      }

      setName('');
      setEditingId(null);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save subject.');
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub._id);
    setName(sub.name);
  };

  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Delete subject "${subName}"?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSuccess(`Subject "${subName}" deleted.`);
      fetchSubjects();
    } catch (err) {
      setError('Failed to delete subject.');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: 'var(--primary-accent)' }} />
            {editingId ? 'Edit Subject' : 'Add New Subject'}
          </h3>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '300px' }}>
            <label className="form-label">Subject Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Social Service & Humanitarian Work"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setName('');
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> {editingId ? 'Update Subject' : 'Add Subject'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Subjects Collection ({subjects.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No subjects added yet.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ fontWeight: 600 }}>{sub.name}</td>
                    <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(sub)} style={{ marginRight: '6px' }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(sub._id, sub.name)}>
                        <Trash2 size={14} />
                      </button>
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

export default Subjects;
