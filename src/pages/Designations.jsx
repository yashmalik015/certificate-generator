import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, UserCog } from 'lucide-react';
import api from '../api/axiosClient';

const Designations = () => {
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchDesignations(); }, []);

  const fetchDesignations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/designations');
      setDesignations(res.data || []);
    } catch (err) {
      console.error('Failed to fetch designations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim()) { setError('Designation name is required.'); return; }
    try {
      if (editingId) {
        await api.put(`/designations/${editingId}`, { name });
        setSuccess('Designation updated successfully.');
      } else {
        await api.post('/designations', { name });
        setSuccess('Designation created successfully.');
      }
      setName(''); setEditingId(null);
      fetchDesignations();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save designation.');
    }
  };

  const handleEdit = (d) => { setEditingId(d._id); setName(d.name); };

  const handleDelete = async (id, dName) => {
    if (!window.confirm(`Delete designation "${dName}"?`)) return;
    try {
      await api.delete(`/designations/${id}`);
      setSuccess(`Designation "${dName}" deleted.`);
      fetchDesignations();
    } catch {
      setError('Failed to delete designation.');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCog size={20} style={{ color: 'var(--primary-accent)' }} />
            {editingId ? 'Edit Designation' : 'Add New Designation'}
          </h3>
        </div>

        {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label">Designation Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. National Member, Ambassador, State Head"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setName(''); }}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> {editingId ? 'Update Designation' : 'Add Designation'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Designations ({designations.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading designations...</div>
        ) : designations.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No designations added yet.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Designation Name</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {designations.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(d)} style={{ marginRight: '6px' }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id, d.name)}>
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

export default Designations;
