import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Check, AlertCircle, Eye, Search, Sparkles, X, CheckSquare, Square } from 'lucide-react';
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

  // Template Picker State
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');
  const [previewingTemplate, setPreviewingTemplate] = useState(null);
  const previewCanvasRef = useRef(null);

  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const commonCountries = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Emirati', 'Nepalese'];

  const categoryTabs = ['All', 'National Honors', 'Business & Excellence', 'Academic & Honorary', 'Literary & Cultural'];

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
          certificateTemplateIds: prev.certificateTemplateIds.length > 0
            ? prev.certificateTemplateIds
            : (templateList.length > 0 ? [templateList[0].id] : [])
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

  const handleSelectAllTemplates = () => {
    const allIds = templates.map((t) => t.id);
    setFormData((prev) => ({ ...prev, certificateTemplateIds: allIds }));
  };

  const handleClearTemplates = () => {
    setFormData((prev) => ({ ...prev, certificateTemplateIds: [] }));
  };

  const handleSelectNewDesigns = () => {
    const newDesignIds = [
      'Bhartiye Ashok Samman',
      'Best Business Icon Award',
      'rashtriya padma bhushan samman',
      'Bhartiye Gaurav Ratan Samman',
      'INTERNATIONAL BUSINESS EXCELLENCE AWARD'
    ];
    setFormData((prev) => ({
      ...prev,
      certificateTemplateIds: Array.from(new Set([...prev.certificateTemplateIds, ...newDesignIds]))
    }));
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

      try {
        const data = new FormData();
        data.append('photo', file);
        await api.post('/uploads/photo', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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

  const [previewLoading, setPreviewLoading] = useState(false);

  // Live Canvas Rendering inside Preview Modal
  useEffect(() => {
    if (!previewingTemplate || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    setPreviewLoading(true);

    const tid = previewingTemplate.id.toLowerCase();
    const candidateUrls = [
      `/assets/certificate-templates/${encodeURIComponent(previewingTemplate.id)}.png`,
      `/certificate-templates/${encodeURIComponent(previewingTemplate.id)}.png`,
      `/api/certificate-templates/${encodeURIComponent(previewingTemplate.id)}/preview`,
      previewingTemplate.previewUrl
    ].filter(Boolean);

    let urlIdx = 0;
    const bgImg = new Image();

    const drawCertificate = (img) => {
      canvas.width = img.width || 700;
      canvas.height = img.height || 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pW = canvas.width;
      const pH = canvas.height;

      // Draw Photo
      if (formData.photoUrl) {
        const pImg = new Image();
        pImg.onload = () => {
          if (tid.includes('padm') || tid.includes('bhushan')) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(361, 340, 70, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(pImg, 361 - 70, 340 - 70, 140, 140);
            ctx.restore();
          } else if (tid.includes('icon') && tid.includes('business')) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(356, 490, 106, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(pImg, 356 - 106, 490 - 106, 212, 212);
            ctx.restore();
          } else if (tid.includes('ashok')) {
            ctx.drawImage(pImg, 280, 563, 122, 137);
          } else if (tid.includes('gaurav')) {
            ctx.drawImage(pImg, 255, 548, 172, 190);
          } else if (tid.includes('business')) {
            ctx.drawImage(pImg, 312, 362, 110, 120);
          } else {
            ctx.drawImage(pImg, 253, 377, 88, 95);
          }
        };
        pImg.src = formData.photoUrl;
      }

      // Draw Recipient Name, Category & Date
      const name = formData.fullName || 'Recipient Full Name';
      const category = formData.category || 'For Outstanding Distinction & Excellence';
      const dateStr = formData.letterIssuedAt ? `Date of Issue : ${formData.letterIssuedAt}` : 'Date of Issue : 2026-09-06';
      ctx.textAlign = 'center';

      if (tid.includes('padm') || tid.includes('bhushan')) {
        ctx.font = 'bold 14px "Times New Roman", serif';
        ctx.fillStyle = '#2a1a08';
        ctx.fillText(name, 361, 434);

        ctx.font = 'bold 14px "Times New Roman", serif';
        ctx.fillStyle = '#b45309';
        ctx.fillText(category, 361, 612);

        ctx.font = 'bold 26px "Times New Roman", serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(name, 361, 672);

        ctx.font = 'bold 13px "Helvetica", sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(formData.letterIssuedAt || '26-Dec-2025', 361, 728);
      } else if (tid.includes('icon') && tid.includes('business')) {
        ctx.font = 'bold 24px "Times New Roman", serif';
        ctx.fillStyle = '#f6e58d';
        ctx.fillText(name, 356, 628);
      } else if (tid.includes('ashok')) {
        ctx.font = 'bold 22px "Times New Roman", serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(name, 341, 726);

        ctx.font = '11.5px "Times New Roman", serif';
        ctx.fillStyle = '#222222';
        ctx.fillText(`For his exceptional work in ${category}, notable accomplishments, and significant contributions towards`, 341, 788);
        ctx.fillText('the progress of the nation.', 341, 804);

        ctx.font = '11px "Helvetica", sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(dateStr, 341, 838);
      } else if (tid.includes('gaurav')) {
        ctx.font = 'bold 24px "Times New Roman", serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(name, 341, 765);

        ctx.font = '11.5px "Times New Roman", serif';
        ctx.fillStyle = '#222222';
        ctx.fillText(`For his exceptional work as a ${category}, notable accomplishments, and significant contributions towards`, 341, 838);
        ctx.fillText('the progress of the nation.', 341, 854);

        ctx.font = '11px "Helvetica", sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(dateStr, 341, 882);
      } else if (tid.includes('business')) {
        ctx.font = 'italic bold 23px "Times New Roman", serif';
        ctx.fillStyle = '#2b1b17';
        ctx.fillText(name, 416, 534);

        ctx.font = '11px "Helvetica", sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(dateStr, 367, 849);
      } else {
        ctx.font = 'bold 18px "Times New Roman", serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(name, pW / 2, 280);
      }
      setPreviewLoading(false);
    };

    const tryNextUrl = () => {
      if (urlIdx < candidateUrls.length) {
        bgImg.src = candidateUrls[urlIdx++];
      } else {
        // Fallback: draw rich vector template preview
        canvas.width = 680;
        canvas.height = 960;
        ctx.fillStyle = '#fdfbf7';
        ctx.fillRect(0, 0, 680, 960);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 12;
        ctx.strokeRect(20, 20, 640, 920);
        ctx.lineWidth = 2;
        ctx.strokeRect(32, 32, 616, 896);

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('Iconic Human Rights & Educational Organisation', 340, 120);

        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Approved by Ministry of Corporate Affairs, Government of India', 340, 150);

        ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#b45309';
        ctx.fillText(previewingTemplate.label, 340, 240);

        // Photo slot
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.drawImage(pImg, 280, 310, 120, 140);
          };
          pImg.src = formData.photoUrl;
        } else {
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(280, 310, 120, 140);
          ctx.strokeStyle = '#94a3b8';
          ctx.strokeRect(280, 310, 120, 140);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText('Photo', 340, 385);
        }

        ctx.font = 'bold 26px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(formData.fullName || 'Recipient Full Name', 340, 520);

        ctx.font = '16px "Inter", sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText(formData.category || 'For Outstanding Distinction & Excellence', 340, 580);

        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`Date of Issue : ${formData.letterIssuedAt || new Date().toISOString().split('T')[0]}`, 340, 720);

        setPreviewLoading(false);
      }
    };

    bgImg.onload = () => drawCertificate(bgImg);
    bgImg.onerror = tryNextUrl;
    tryNextUrl();
  }, [previewingTemplate, formData]);

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
        setSuccess('Student record updated and certificates regenerated successfully!');
        setTimeout(() => navigate('/superpanel/students'), 1200);
      } else {
        await api.post('/students', formData);
        setSuccess('Student record created and certificates generated successfully!');

        if (createAnother) {
          await loadAutoNumbers();
          setFormData((prev) => ({
            ...prev,
            fullName: '',
            fathersHusbandName: '',
            address: '',
            email: '',
            phoneNumber: '',
            dateOfBirth: '',
            category: '',
            photoUrl: ''
          }));
        } else {
          setTimeout(() => navigate('/superpanel/students'), 1200);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student record.');
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on category tab & search query
  const filteredTemplates = templates.filter((tpl) => {
    const matchesCategory = selectedCategoryTab === 'All' || tpl.category === selectedCategoryTab;
    const matchesSearch = !templateSearch || tpl.label.toLowerCase().includes(templateSearch.toLowerCase()) || tpl.id.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getBadgeClass = (category) => {
    switch (category) {
      case 'National Honors': return 'badge-national';
      case 'Business & Excellence': return 'badge-business';
      case 'Academic & Honorary': return 'badge-academic';
      case 'Literary & Cultural': return 'badge-literary';
      default: return 'badge-general';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Link
            to="/superpanel/students"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '6px' }}
          >
            <ArrowLeft size={16} /> Back to recipients list
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
            {isEdit ? `Edit Recipient: ${formData.fullName || formData.refno}` : 'Create New Recipient Record'}
          </h1>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--danger)',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--success)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="card" style={{ padding: '28px' }}>
        <div className="form-grid">
          {/* Refno */}
          <div className="form-group">
            <label className="form-label">Ref. Serial No. <span className="required">*</span></label>
            <input
              type="text"
              name="refno"
              className="form-control"
              placeholder="e.g. IHREO/2026/002"
              value={formData.refno}
              onChange={handleChange}
              required
            />
          </div>

          {/* Certificate Number */}
          <div className="form-group">
            <label className="form-label">Certificate Unique Number <span className="required">*</span></label>
            <input
              type="text"
              name="certificateNumber"
              className="form-control"
              placeholder="e.g. IHREO/CERT/2026/0002"
              value={formData.certificateNumber}
              onChange={handleChange}
              required
            />
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Recipient Full Name <span className="required">*</span></label>
            <input
              type="text"
              name="fullName"
              className="form-control"
              placeholder="e.g. Dr. Jojo Koruth James"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Father / Husband Name */}
          <div className="form-group">
            <label className="form-label">Father / Husband Name</label>
            <input
              type="text"
              name="fathersHusbandName"
              className="form-control"
              placeholder="Enter father or husband name"
              value={formData.fathersHusbandName}
              onChange={handleChange}
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
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              name="phoneNumber"
              className="form-control"
              placeholder="+91 9876543210"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          {/* Category / Award Subject */}
          <div className="form-group">
            <label className="form-label">Category / Award Subject <span className="required">*</span></label>
            <input
              type="text"
              name="category"
              className="form-control"
              placeholder="e.g. Social Work, Wild Life Expert, Business Leadership"
              value={formData.category}
              onChange={handleChange}
              required
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
            <label className="form-label">Letter / Certificate Issue Date <span className="required">*</span></label>
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
                  <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>✓ Photo Uploaded & Ready for Embedding</div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Certificate Template Picker Checkbox Grid (As requested in Image 1) */}
          <div className="form-group full-width">
            <div className="template-picker-container">
              {/* Header & Quick Action Toolbar */}
              <div className="template-picker-header-row">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} style={{ color: 'var(--primary-accent)' }} />
                    <label className="form-label" style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                      Certificates (Templates dynamically scanned from template folder) <span className="required">*</span>
                    </label>
                  </div>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                    {formData.certificateTemplateIds.length} of {templates.length} certificate designs selected for this recipient.
                  </p>
                </div>

                <div className="template-quick-actions">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleSelectNewDesigns}
                    style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                  >
                    ✨ Select 5 New Designs
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleSelectAllTemplates}>
                    Select All
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleClearTemplates}>
                    Clear
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Search */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div className="template-filter-tabs">
                  {categoryTabs.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`template-tab-btn ${selectedCategoryTab === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategoryTab(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="search-box" style={{ maxWidth: '240px' }}>
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Filter certificates..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    style={{ padding: '6px 10px 6px 32px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* 4-Column Checkbox Grid (Exact Layout from Image 1) */}
              <div className="cert-checkbox-grid">
                {filteredTemplates.map((tpl) => {
                  const isChecked = formData.certificateTemplateIds?.includes(tpl.id);
                  return (
                    <div
                      key={tpl.id}
                      className={`cert-checkbox-tile ${isChecked ? 'checked' : ''}`}
                      onClick={() => handleTemplateToggle(tpl.id)}
                    >
                      <div className="cert-checkbox-left">
                        <input
                          type="checkbox"
                          className="cert-checkbox-input"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent div onClick
                        />
                        <span className="cert-checkbox-label" title={tpl.label}>
                          {tpl.label}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="cert-tile-preview-btn"
                        title="Live Certificate Preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingTemplate(tpl);
                        }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                    </div>
                  );
                })}
              </div>
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
            {loading ? 'Processing...' : (isEdit ? 'Save Changes & Regenerate' : 'Create & Generate Certificates')}
          </button>
        </div>
      </div>

      {/* Live Certificate Preview Modal */}
      {previewingTemplate && (
        <div className="cert-preview-modal-overlay" onClick={() => setPreviewingTemplate(null)}>
          <div className="cert-preview-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="cert-preview-modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                  Certificate Preview: {previewingTemplate.label}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Live simulation showing recipient data mapped to this template
                </p>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setPreviewingTemplate(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cert-preview-modal-body" style={{ position: 'relative', minHeight: '360px' }}>
              {previewLoading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.7)', zIndex: 10 }}>
                  <div style={{ width: '36px', height: '36px', border: '3px solid #cbd5e1', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
                  <span style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600 }}>Rendering live certificate simulation...</span>
                </div>
              )}
              <canvas ref={previewCanvasRef} className="cert-preview-canvas" />
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn ${formData.certificateTemplateIds.includes(previewingTemplate.id) ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => {
                  handleTemplateToggle(previewingTemplate.id);
                  setPreviewingTemplate(null);
                }}
              >
                {formData.certificateTemplateIds.includes(previewingTemplate.id)
                  ? 'Remove from selected templates'
                  : '✓ Add to selected templates'}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPreviewingTemplate(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentForm;
