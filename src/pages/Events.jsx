import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Check, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Event name is required.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/events/${editingId}`, { name, description });
        setSuccess('Event updated successfully.');
      } else {
        await api.post('/events', { name, description });
        setSuccess('Event created successfully.');
      }

      setName('');
      setDescription('');
      setEditingId(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event.');
    }
  };

  const handleEdit = (ev) => {
    setEditingId(ev._id);
    setName(ev.name);
    setDescription(ev.description || '');
  };

  const handleDelete = async (id, evName) => {
    if (!window.confirm(`Delete event "${evName}"?`)) return;
    try {
      await api.delete(`/events/${id}`);
      setSuccess(`Event "${evName}" deleted.`);
      fetchEvents();
    } catch (err) {
      setError('Failed to delete event.');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--primary-accent)' }} />
            {editingId ? 'Edit Event' : 'Add New Event'}
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
          <div className="form-group" style={{ flex: 1, minWidth: '240px' }}>
            <label className="form-label">Event Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. National Excellence Awards 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ flex: 2, minWidth: '300px' }}>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              placeholder="Brief description of the event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  setDescription('');
                }}
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> {editingId ? 'Update Event' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Events Collection ({events.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No events added yet.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Description</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td style={{ fontWeight: 600 }}>{ev.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{ev.description || '—'}</td>
                    <td>{new Date(ev.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleEdit(ev)} style={{ marginRight: '6px' }}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ev._id, ev.name)}>
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

export default Events;
