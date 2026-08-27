import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Check, AlertCircle } from 'lucide-react';
import api from '../api/axiosClient';

const StudentForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    refno: '',
    fullName: '',
    fathersHusbandName: '',
    address: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    letterIssuedAt: new Date().toISOString().split('T')[0],
    certificateNumber: '',
    category: '',
    bloodGroup: 'O+',
    nationality: 'Indian',
    designation: '',
    eventId: '',
    subjectId: '',
    certificateTemplateIds: [],
    photoUrl: '',
    status: 'Active'
  });

  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const commonCountries = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Emirati', 'Nepalese'];

  useEffect(() => {
    loadOptions();
    if (isEdit) {
      loadStudent();
    } else {
      loadAutoNumbers();
    }
  }, [id]);

  const loadOptions = async () => {
    try {
      const [eventsRes, subjectsRes, templatesRes, designationsRes] = await Promise.all([
        api.get('/events'),
        api.get('/subjects'),
        api.get('/certificate-templates'),
        api.get('/designations')
      ]);

      setEvents(eventsRes.data || []);
      setSubjects(subjectsRes.data || []);
      const templateList = templatesRes.data || [];
      setTemplates(templateList);
      setDesignations(designationsRes.data || []);

      // Default select first event, subject, and template if new
      if (!isEdit) {
        setFormData((prev) => ({
          ...prev,
          eventId: prev.eventId || (eventsRes.data[0]?._id || ''),
          subjectId: prev.subjectId || (subjectsRes.data[0]?._id || ''),
          certificateTemplateIds: prev.certificateTemplateIds.length > 0 ? prev.certificateTemplateIds : (templateList.length > 0 ? [templateList[0].id] : [])
        }));
      }
    } catch (err) {
      console.error('Failed to load form options:', err);
    }
  };

  const loadAutoNumbers = async () => {
    try {
      const res = await api.get('/students/auto-numbers');
      setFormData((prev) => ({
        ...prev,
        refno: res.data.refno,
        certificateNumber: res.data.certificateNumber
      }));
    } catch (err) {
      console.error('Failed to auto-generate numbers:', err);
    }
  };

  const loadStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      const data = res.data;
      setFormData({
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
        letterIssuedAt: data.letterIssuedAt ? new Date(data.letterIssuedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        eventId: typeof data.eventId === 'object' ? data.eventId._id : data.eventId,
        subjectId: typeof data.subjectId === 'object' ? data.subjectId._id : data.subjectId
      });
    } catch (err) {
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateToggle = (templateId) => {
    setFormData((prev) => {
      const current = prev.certificateTemplateIds || [];
      const updated = current.includes(templateId)
        ? current.filter((t) => t !== templateId)
        : [...current, templateId];
      return { ...prev, certificateTemplateIds: updated };
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Photo size exceeds 10MB limit.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      setFormData((prev) => ({ ...prev, photoUrl: base64Url }));

      // Also attempt server upload for file endpoint
      try {
        const data = new FormData();
        data.append('photo', file);
        const res = await api.post('/uploads/photo', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data && res.data.photoUrl) {
          // If server photoUrl is relative, keep base64 or server URL
        }
      } catch (uploadErr) {
        console.warn('Server photo upload backup warning:', uploadErr.message);
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read selected photo file.');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const saveStudent = async (createAnother = false) => {
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) return setError('Full Name is required.');
    if (!formData.category.trim()) return setError('Category is required.');
    if (!formData.photoUrl) return setError('Recipient photo upload is required.');
    if (!formData.eventId) return setError('Event selection is required.');
    if (!formData.subjectId) return setError('Subject selection is required.');
    if (!formData.certificateTemplateIds || formData.certificateTemplateIds.length === 0) {
      return setError('At least one Certificate Template must be selected.');
    }

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/students/${id}`, formData);
        setSuccess('Student record updated and certificates regenerated.');
        setTimeout(() => navigate('/superpanel/students'), 1200);
      } else {
        await api.post('/students', formData);
        setSuccess('Student record created and certificates generated successfully!');

        if (createAnother) {
          // Reset form for next entry
          await loadAutoNumbers();
          setFormData((prev) => ({
            ...prev,
            fullName: '',
            fathersHusbandName: '',
            address: '',
            email: '',
            phoneNumber: '',
            category: '',
            photoUrl: ''
          }));
          setSuccess('Record created! Ready for next entry.');
        } else {
          setTimeout(() => navigate('/superpanel/students'), 1200);
        }
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'string' ? data : (typeof data?.error === 'string' ? data.error : (typeof data?.message === 'string' ? data.message : 'Failed to save student record.'));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/superpanel/students" className="btn btn-outline btn-sm">
          <ArrowLeft size={14} /> Back to Students List
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{isEdit ? 'Edit Student Record' : 'Create New Student & Issue Certificates'}</h3>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} /> {success}
          </div>
        )}

        <div className="form-grid">
          {/* Reference Number */}
          <div className="form-group">
            <label className="form-label">Reference Number <span className="required">*</span></label>
            <input
              type="text"
              name="refno"
              className="form-control"
              value={formData.refno}
              onChange={handleChange}
              required
            />
          </div>

          {/* Certificate Number */}
          <div className="form-group">
            <label className="form-label">Certificate Number <span className="required">*</span></label>
            <input
              type="text"
              name="certificateNumber"
              className="form-control"
              value={formData.certificateNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name <span className="required">*</span></label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Father / Husband Name */}
          <div className="form-group">
            <label className="form-label">Fathers / Husband Name</label>
            <input
              type="text"
              name="fathersHusbandName"
              className="form-control"
              placeholder="e.g. Shri S. P. Sharma"
              value={formData.fathersHusbandName}
              onChange={handleChange}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category <span className="required">*</span></label>
            <input
              type="text"
              name="category"
              className="form-control"
              placeholder="e.g. Social Work & Higher Education"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="recipient@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label">Number (Phone)</label>
            <input
              type="text"
              name="phoneNumber"
              className="form-control"
              placeholder="+91 98765 43210"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              className="form-control"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          {/* Letter Issued At */}
          <div className="form-group">
            <label className="form-label">Letter Issued At <span className="required">*</span></label>
            <input
              type="date"
              name="letterIssuedAt"
              className="form-control"
              value={formData.letterIssuedAt}
              onChange={handleChange}
              required
            />
          </div>

          {/* Blood Group */}
          <div className="form-group">
            <label className="form-label">Blood Group <span className="required">*</span></label>
            <select
              name="bloodGroup"
              className="form-control"
              value={formData.bloodGroup}
              onChange={handleChange}
              required
            >
              {bloodGroupOptions.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Nationality */}
          <div className="form-group">
            <label className="form-label">Nationality <span className="required">*</span></label>
            <select
              name="nationality"
              className="form-control"
              value={formData.nationality}
              onChange={handleChange}
              required
            >
              {commonCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div className="form-group">
            <label className="form-label">Designation</label>
            <select
              name="designation"
              className="form-control"
              value={formData.designation}
              onChange={handleChange}
            >
              <option value="">-- Select Designation (for ID Card) --</option>
              {designations.map((d) => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Select Event */}
          <div className="form-group">
            <label className="form-label">Select Event <span className="required">*</span></label>
            <select
              name="eventId"
              className="form-control"
              value={formData.eventId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Event --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="form-group">
            <label className="form-label">Subject <span className="required">*</span></label>
            <select
              name="subjectId"
              className="form-control"
              value={formData.subjectId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-control"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Address */}
          <div className="form-group full-width">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              className="form-control"
              placeholder="Enter recipient full address details..."
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Dynamic Certificates Selection (Multi-select) */}
          <div className="form-group full-width">
            <label className="form-label">
              Certificates (Templates dynamically scanned from template folder) <span className="required">*</span>
            </label>
            <div className="template-checkbox-grid">
              {templates.map((tpl) => {
                const isChecked = formData.certificateTemplateIds?.includes(tpl.id);
                return (
                  <label key={tpl.id} className="template-checkbox-item">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTemplateToggle(tpl.id)}
                    />
                    <span>{tpl.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Photo Upload */}
          <div className="form-group full-width">
            <label className="form-label">Recipient Photo <span className="required">*</span></label>
            <div className="photo-upload-box" onClick={() => document.getElementById('photo-file-input').click()}>
              <Upload size={24} style={{ color: 'var(--primary-accent)', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Click or Drag photo here to upload</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supports JPG, PNG up to 10MB</p>
              <input
                id="photo-file-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              {uploadingPhoto && <p style={{ fontSize: '13px', color: 'var(--primary-accent)', marginTop: '8px' }}>Uploading photo...</p>}
              {formData.photoUrl && (
                <div>
                  <img src={formData.photoUrl} alt="Recipient Preview" className="photo-preview" />
                  <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>✓ Photo Uploaded</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/superpanel/students')}
            disabled={loading}
          >
            Cancel
          </button>

          {!isEdit && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => saveStudent(true)}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Create & create another'}
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => saveStudent(false)}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isEdit ? 'Save Changes' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
