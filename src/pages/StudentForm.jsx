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
      const [eventsRes, subjectsRes, templatesRes, designationsRes] = await Promise.allSettled([
        api.get('/events'),
        api.get('/subjects'),
        api.get('/certificate-templates'),
        api.get('/designations')
      ]);

      const eventsData = eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value?.data) ? eventsRes.value.data : [];
      const subjectsData = subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value?.data) ? subjectsRes.value.data : [];
      const templatesData = templatesRes.status === 'fulfilled' && Array.isArray(templatesRes.value?.data) ? templatesRes.value.data : [];
      const designationsData = designationsRes.status === 'fulfilled' && Array.isArray(designationsRes.value?.data) ? designationsRes.value.data : [];

      setEvents(eventsData);
      setSubjects(subjectsData);
      setTemplates(templatesData);
      setDesignations(designationsData);

      // Default select first event, subject, and template if new
      if (!isEdit) {
        setFormData((prev) => ({
          ...prev,
          eventId: prev.eventId || (eventsData[0]?._id || ''),
          subjectId: prev.subjectId || (subjectsData[0]?._id || ''),
          certificateTemplateIds: (Array.isArray(prev.certificateTemplateIds) && prev.certificateTemplateIds.length > 0)
            ? prev.certificateTemplateIds
            : (templatesData.length > 0 ? [templatesData[0].id] : [])
        }));
      }
    } catch (err) {
      console.error('Failed to load form options:', err);
    }
  };

  const loadAutoNumbers = async () => {
    try {
      const res = await api.get('/students/auto-numbers');
      if (res.data?.refno && res.data?.certificateNumber) {
        setFormData((prev) => ({
          ...prev,
          refno: prev.refno || res.data.refno,
          certificateNumber: prev.certificateNumber || res.data.certificateNumber
        }));
      }
    } catch (err) {
      console.error('Failed to auto-generate numbers:', err);
    }
  };

  const loadStudent = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/students/${id}`);
      const data = res.data;
      if (data) {
        setFormData({
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          letterIssuedAt: data.letterIssuedAt ? new Date(data.letterIssuedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          eventId: typeof data.eventId === 'object' && data.eventId ? data.eventId._id : data.eventId,
          subjectId: typeof data.subjectId === 'object' && data.subjectId ? data.subjectId._id : data.subjectId,
          certificateTemplateIds: Array.isArray(data.certificateTemplateIds) ? data.certificateTemplateIds : []
        });
      }
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
      const current = Array.isArray(prev.certificateTemplateIds) ? prev.certificateTemplateIds : [];
      const updated = current.includes(templateId)
        ? current.filter((t) => t !== templateId)
        : [...current, templateId];
      return { ...prev, certificateTemplateIds: updated };
    });
  };

  const handleSelectAllTemplates = () => {
    const allIds = Array.isArray(templates) ? templates.map((t) => t?.id).filter(Boolean) : [];
    setFormData((prev) => ({ ...prev, certificateTemplateIds: allIds }));
  };

  const handleClearTemplates = () => {
    setFormData((prev) => ({ ...prev, certificateTemplateIds: [] }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Photo size exceeds 15MB limit.');
      return;
    }

    setUploadingPhoto(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      const rawBase64 = reader.result;
      // Client-side image resize to max 900x900 for fast upload and zero-lag rendering
      const img = new Image();
      img.onload = () => {
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setFormData((prev) => ({ ...prev, photoUrl: optimizedBase64 }));
        setUploadingPhoto(false);
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, photoUrl: rawBase64 }));
        setUploadingPhoto(false);
      };
      img.src = rawBase64;
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

    const candidateUrls = [
      `/assets/certificate-templates/${encodeURIComponent(previewingTemplate.id)}.png`,
      `/certificate-templates/${encodeURIComponent(previewingTemplate.id)}.png`,
      `/assets/certificate-templates/Doctorate IHREO.png`,
      `/certificate-templates/Doctorate IHREO.png`,
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
      const name = (formData.fullName || 'Recipient Full Name').toUpperCase();
      const category = formData.category || 'For Outstanding Distinction & Excellence';
      const dateFormatted = formData.letterIssuedAt
        ? formData.letterIssuedAt.split('-').reverse().join('-')
        : new Date().toISOString().split('T')[0].split('-').reverse().join('-');

      const lowerId = String(previewingTemplate.id || '').toLowerCase();

      if (lowerId.includes('doctorate')) {
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(253, 377, 88, 95, 4);
            else ctx.rect(253, 377, 88, 95);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(pImg, 253, 377, 88, 95);
            ctx.restore();

            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(253, 377, 88, 95, 4);
            else ctx.rect(253, 377, 88, 95);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#222222';
            ctx.stroke();
          };
          pImg.src = formData.photoUrl;
        }
        ctx.textAlign = 'center';
        ctx.font = 'bold 17px "Times New Roman", serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(name, pW / 2, 280);

        ctx.font = 'bold 13.5px "Times New Roman", serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText(category, pW / 2, 202);

        const dateStr = formData.letterIssuedAt ? `Date of Issue : ${formData.letterIssuedAt}` : `Date of Issue : ${new Date().toISOString().split('T')[0]}`;
        ctx.font = '9.5px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateStr, pW / 2, 138);
      } else if (lowerId.includes('padma') || lowerId.includes('padm')) {
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pW / 2, 340, 72, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pImg, pW / 2 - 72, 340 - 72, 144, 144);
            ctx.restore();
          };
          pImg.src = formData.photoUrl;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16.5px "Times New Roman", serif';
        ctx.fillStyle = '#102a4e';
        ctx.fillText(name, pW / 2, 435);

        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 13px "Times New Roman", serif';
        ctx.fillStyle = '#991b1b';
        ctx.fillText(category, pW / 2, 590);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateFormatted, 485, 896);
      } else if (lowerId.includes('business')) {
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pW / 2, 485, 108, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pImg, pW / 2 - 108, 485 - 108, 216, 216);
            ctx.restore();
          };
          pImg.src = formData.photoUrl;
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 19px "Times New Roman", serif';
        ctx.fillStyle = '#fde088';
        ctx.fillText(name, pW / 2, 626);

        ctx.textBaseline = 'alphabetic';
        ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(`Date: ${dateFormatted}`, pW / 2, 885);
      } else if (lowerId.includes('gaurav') || lowerId.includes('ashok') || lowerId.includes('ratan')) {
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.drawImage(pImg, (pW - 172) / 2, 540, 172, 196);
          };
          pImg.src = formData.photoUrl;
        }
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px "Times New Roman", serif';
        ctx.fillStyle = '#0f2137';
        ctx.fillText(name, pW / 2, 765);

        ctx.textAlign = 'left';
        ctx.font = 'bold 12px "Times New Roman", serif';
        ctx.fillStyle = '#991b1b';
        ctx.fillText(category, 310, 838);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateFormatted, 380, 878);
      } else if (lowerId.includes('women') || lowerId.includes('icon')) {
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(pW / 2, 460, 85, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pImg, pW / 2 - 85, 460 - 85, 170, 170);
            ctx.restore();
          };
          pImg.src = formData.photoUrl;
        }
        ctx.textAlign = 'center';
        ctx.font = 'bold 19px "Times New Roman", serif';
        ctx.fillStyle = '#0f2137';
        ctx.fillText(name, pW / 2, 712);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10.5px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateFormatted, 530, 828);
      } else {
        // Arya Bhushan Samaj Seva Award (No photo overlay!)
        ctx.textAlign = 'center';
        ctx.font = 'bold 19px "Times New Roman", serif';
        ctx.fillStyle = '#0c1e36';
        ctx.fillText(name, pW / 2, 528);

        ctx.font = 'bold 14.5px "Times New Roman", serif';
        ctx.fillStyle = '#a81c1c';
        ctx.fillText(category, pW / 2, 710);

        ctx.textAlign = 'left';
        ctx.font = 'bold 10.5px Helvetica, Arial, sans-serif';
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateFormatted, 535, 854);
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
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 10;
        ctx.strokeRect(20, 20, 640, 920);
        ctx.lineWidth = 2;
        ctx.strokeRect(32, 32, 616, 896);

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText('Iconic Human Rights & Educational Organisation', 340, 120);

        ctx.font = '13px "Inter", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Approved by Ministry of Corporate Affairs, Government of India', 340, 150);

        ctx.font = 'bold 24px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#1e3a8a';
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

        ctx.font = 'bold 22px "Playfair Display", Georgia, serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(formData.fullName || 'Recipient Full Name', 340, 520);

        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillStyle = '#dc2626';
        ctx.fillText(formData.category || 'For Outstanding Distinction & Excellence', 340, 580);

        ctx.font = '13px "Inter", sans-serif';
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

    if (!formData.fullName?.trim()) return setError('Full Name is required.');
    if (!formData.category?.trim()) return setError('Category is required.');
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
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save student record.';
      setError(String(errMsg));
    } finally {
      setLoading(false);
    }
  };

  // Filter templates based on category tab & search query safely
  const filteredTemplates = Array.isArray(templates) ? templates.filter((tpl) => {
    if (!tpl) return false;
    const matchesCategory = selectedCategoryTab === 'All' || tpl.category === selectedCategoryTab;
    const label = String(tpl.label || tpl.id || '').toLowerCase();
    const tid = String(tpl.id || '').toLowerCase();
    const q = String(templateSearch || '').toLowerCase();
    const matchesSearch = !q || label.includes(q) || tid.includes(q);
    return matchesCategory && matchesSearch;
  }) : [];

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
