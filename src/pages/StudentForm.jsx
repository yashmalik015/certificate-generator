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
    cin_no: 'U85499DL2025NPL459383',
    licence_no: '176566',
    reg_no: '459383',
    serial_no: '',
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
  const commonCountries = ['Indian', 'American', 'British', 'Canadian', 'Australian', 'German', 'French', 'Emirati', 'Nepalese', 'Bangladeshi'];

  const categoryTabs = ['All', 'Academic & Honorary', 'Membership', 'Identity Card'];

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

      // Default select first event, subject, and all templates if new
      if (!isEdit) {
        setFormData((prev) => ({
          ...prev,
          eventId: prev.eventId || (eventsData[0]?._id || ''),
          subjectId: prev.subjectId || (subjectsData[0]?._id || ''),
          certificateTemplateIds: (Array.isArray(prev.certificateTemplateIds) && prev.certificateTemplateIds.length > 0)
            ? prev.certificateTemplateIds
            : (templatesData.length > 0 ? templatesData.map((t) => t.id) : ['Doctorate IHREO'])
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
          cin_no: data.cin_no || 'U85499DL2025NPL459383',
          licence_no: data.licence_no || '176566',
          reg_no: data.reg_no || '459383',
          serial_no: data.serial_no || '',
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
      // Preserve high resolution for crisp print-quality output (downscale only if exceeding 2400px)
      const img = new Image();
      img.onload = () => {
        const maxDim = 2400;
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
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.95);
          setFormData((prev) => ({ ...prev, photoUrl: optimizedBase64 }));
        } else {
          setFormData((prev) => ({ ...prev, photoUrl: rawBase64 }));
        }
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

    // Helper to draw rounded rectangle cross-environment
    const drawRoundedRect = (ctx, x, y, width, height, radius) => {
      const r = Math.min(Math.max(0, radius), width / 2, height / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.arcTo(x + width, y, x + width, y + r, r);
      ctx.lineTo(x + width, y + height - r);
      ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
      ctx.lineTo(x + r, y + height);
      ctx.arcTo(x, y + height, x, y + height - r, r);
      ctx.lineTo(x + r, y);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    const PHOTO_CONFIGS = {
      'international-business-excellence-award': {
        innerX: 254.91,
        innerY: 438.94,
        innerWidth: 85.45,
        innerHeight: 96.72,
        cornerRadius: 6.0,
        frameX: 254.91,
        frameY: 438.94,
        frameWidth: 85.45,
        frameHeight: 96.72,
        frameRadius: 6.0,
        borderWidth: 0,
        borderColor: null
      },
      'rashtriya-gaurav-ratan-samman': {
        innerX: 244.20,
        innerY: 415.89,
        innerWidth: 106.86,
        innerHeight: 110.50,
        cornerRadius: 10.84,
        frameX: 244.20,
        frameY: 415.89,
        frameWidth: 106.86,
        frameHeight: 110.50,
        frameRadius: 10.84,
        borderWidth: 0,
        borderColor: null
      },
      'bhartiya-gaurav-ratan-samman': {
        innerX: 244.4287,
        innerY: 253.0951,
        innerWidth: 106.8559,
        innerHeight: 113.6576,
        cornerRadius: 10.8388,
        frameX: 243.4286,
        frameY: 252.0950,
        frameWidth: 108.8561,
        frameHeight: 115.6578,
        frameRadius: 11.8389,
        borderWidth: 2.0001,
        borderColor: '#754805'
      },
      'rashtriya-padma-shree-samman': {
        innerX: 245.2087,
        innerY: 380.3171,
        innerWidth: 106.8559,
        innerHeight: 113.6576,
        cornerRadius: 10.8388,
        frameX: 244.2086,
        frameY: 379.3170,
        frameWidth: 108.8561,
        frameHeight: 115.6578,
        frameRadius: 11.8389,
        borderWidth: 2.0001,
        borderColor: '#754805'
      },
      'bhartiya-padma-bhushan-samman': {
        innerX: 244.4287,
        innerY: 253.0951,
        innerWidth: 106.8559,
        innerHeight: 113.6576,
        cornerRadius: 10.8388,
        frameX: 243.4286,
        frameY: 252.0950,
        frameWidth: 108.8561,
        frameHeight: 115.6578,
        frameRadius: 11.8389,
        borderWidth: 2.0001,
        borderColor: '#754805'
      },
      'arya-bhushan-samaj-seva-award': {
        innerX: 254.88,
        innerY: 441.48,
        innerWidth: 85.30,
        innerHeight: 97.23,
        cornerRadius: 6.59,
        frameX: 254.59,
        frameY: 441.20,
        frameWidth: 85.87,
        frameHeight: 97.80,
        frameRadius: 6.87,
        borderWidth: 0.5669,
        borderColor: '#000000'
      },
      'doctorate-ihreo': {
        innerX: 254.41,
        innerY: 378.53,
        innerWidth: 86.51,
        innerHeight: 93.55,
        cornerRadius: 8.81,
        frameX: 253.66,
        frameY: 377.78,
        frameWidth: 88.01,
        frameHeight: 95.05,
        frameRadius: 9.56,
        borderWidth: 1.5,
        borderColor: '#222222'
      },
      'universal-id-card': {
        innerX: 14.91,
        innerY: 38.62,
        innerWidth: 36.71,
        innerHeight: 40.59,
        cornerRadius: 3.56,
        frameX: 14.41,
        frameY: 38.12,
        frameWidth: 37.71,
        frameHeight: 41.59,
        frameRadius: 4.06,
        borderWidth: 1.0,
        borderColor: '#333333'
      },
      'universal-membership-certificate': {
        innerX: 255.38,
        innerY: 360.84,
        innerWidth: 86.56,
        innerHeight: 98.08,
        cornerRadius: 8.81,
        frameX: 254.63,
        frameY: 360.09,
        frameWidth: 88.06,
        frameHeight: 99.58,
        frameRadius: 9.56,
        borderWidth: 1.5,
        borderColor: '#333333'
      }
    };

    const renderPhotoOnCanvas = (ctx, photo, cfg, scaleX, scaleY, pageHeight, focalPoint) => {
      if (!photo || !cfg) return;
      const innerCanvasX = cfg.innerX * scaleX;
      const innerCanvasY = (pageHeight - cfg.innerY - cfg.innerHeight) * scaleY;
      const innerCanvasW = cfg.innerWidth * scaleX;
      const innerCanvasH = cfg.innerHeight * scaleY;
      const innerRadius = cfg.cornerRadius * scaleX;

      const frameCanvasX = cfg.frameX * scaleX;
      const frameCanvasY = (pageHeight - cfg.frameY - cfg.frameHeight) * scaleY;
      const frameCanvasW = cfg.frameWidth * scaleX;
      const frameCanvasH = cfg.frameHeight * scaleY;
      const frameRadius = cfg.frameRadius * scaleX;
      const frameBw = cfg.borderWidth * scaleX;

      const fx = typeof focalPoint?.x === 'number' ? focalPoint.x : 0.5;
      const fy = typeof focalPoint?.y === 'number' ? focalPoint.y : 0.5;

      const imgW = photo.naturalWidth || photo.width || 400;
      const imgH = photo.naturalHeight || photo.height || 400;
      const imgAspect = imgW / imgH;
      const frameAspect = innerCanvasW / innerCanvasH;

      let dW, dH, dX, dY;
      if (imgAspect > frameAspect) {
        dH = innerCanvasH;
        dW = dH * imgAspect;
        const excessW = dW - innerCanvasW;
        dX = innerCanvasX - excessW * fx;
        dY = innerCanvasY;
      } else {
        dW = innerCanvasW;
        dH = dW / imgAspect;
        const excessH = dH - innerCanvasH;
        dX = innerCanvasX;
        dY = innerCanvasY - excessH * fy;
      }

      // 1. Clip to inner aperture
      ctx.save();
      drawRoundedRect(ctx, innerCanvasX, innerCanvasY, innerCanvasW, innerCanvasH, innerRadius);
      ctx.clip();
      ctx.drawImage(photo, dX, dY, dW, dH);
      ctx.restore();

      // 2. Stroke frame overlay
      if (frameBw > 0 && cfg.borderColor) {
        ctx.save();
        drawRoundedRect(ctx, frameCanvasX, frameCanvasY, frameCanvasW, frameCanvasH, frameRadius);
        ctx.lineWidth = frameBw;
        ctx.strokeStyle = cfg.borderColor;
        ctx.stroke();
        ctx.restore();
      }
    };

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

      if (lowerId.includes('appreciation')) {
        const scaleX = pW / 841.8898;
        const scaleY = pH / 595.2756;

        const rawName = String(formData.fullName || 'Recipient Full Name').trim();
        ctx.textAlign = 'center';
        let namePx = Math.round(40.5 * scaleX);
        ctx.font = `${namePx}px "Times New Roman", Times, serif`;
        while (namePx > Math.round(18.0 * scaleX) && ctx.measureText(rawName).width > 440 * scaleX) {
          namePx -= 1;
          ctx.font = `${namePx}px "Times New Roman", Times, serif`;
        }
        ctx.fillStyle = '#111827';
        ctx.fillText(rawName, 430.42 * scaleX, (595.2756 - 327.13) * scaleY);
      } else if (lowerId.includes('international') || (lowerId.includes('business') && lowerId.includes('excellence'))) {
        const scaleX = pW / 595.28;
        const scaleY = pH / 841.89;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licenceNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO028');
        const regNo = formData.reg_no || '459383';

        // 1. Top Left 4 Lines
        ctx.fillStyle = '#111827';
        const fontSizePx = Math.round(8.25 * scaleX);
        ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`CIN NO:- ${cinNo}`, 82.00 * scaleX, (841.89 - 747.00) * scaleY);
        ctx.fillText(`Licence No:- ${licenceNo}`, 82.00 * scaleX, (841.89 - 737.00) * scaleY);
        ctx.fillText(`Sl. No. ${slNo}`, 82.00 * scaleX, (841.89 - 727.00) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 82.00 * scaleX, (841.89 - 717.00) * scaleY);

        // 2. Photo inside original rounded frame
        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['international-business-excellence-award'], scaleX, scaleY, 841.89, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        // 3. Recipient Name: Italic serif, dark brown (#4d220e)
        const rawName = formData.fullName || 'Recipient Full Name';
        let namePx = Math.round(23.0 * scaleX);
        ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
        const maxNamePx = 260 * scaleX;
        while (namePx > Math.round(10 * scaleX) && ctx.measureText(rawName).width > maxNamePx) {
          namePx -= 1;
          ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
        }
        const nameW = ctx.measureText(rawName).width;
        let nameLeftPx = (297.64 * scaleX) - (nameW / 2);
        if (nameLeftPx < 185 * scaleX) {
          nameLeftPx = 185 * scaleX;
        }
        if (nameLeftPx + nameW > 485 * scaleX) {
          nameLeftPx = (485 * scaleX) - nameW;
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#4d220e';
        ctx.fillText(rawName, nameLeftPx, (841.89 - 388.50) * scaleY);

        // 4. Dynamic Category / Award Subject
        let rawCat = formData.category || formData.awardSubject || formData.subject || 'International Business & Entrepreneurship';
        let cleanCat = String(rawCat).trim();
        cleanCat = cleanCat.replace(/^[(\s]+/, '').replace(/[).\s]+$/, '').trim();
        if (!cleanCat) cleanCat = 'International Business & Entrepreneurship';
        const catDisplay = cleanCat.endsWith(',') ? cleanCat : `${cleanCat},`;

        let catPx = Math.round(16.0 * scaleX);
        ctx.font = `bold ${catPx}px "Times New Roman", serif`;
        const maxCatPx = 420 * scaleX;
        while (catPx > Math.round(9 * scaleX) && ctx.measureText(catDisplay).width > maxCatPx) {
          catPx -= 1;
          ctx.font = `bold ${catPx}px "Times New Roman", serif`;
        }
        ctx.fillText(catDisplay, pW / 2, (841.89 - 251.50) * scaleY);

        // 5. Date of Issue: "Date of Issue : DD/MM/YY"
        const rawDate = formData.letterIssuedAt || formData.issue_date || new Date();
        const dateFormattedInt = typeof rawDate === 'string' && rawDate.includes('-')
          ? rawDate.split('-').reverse().map((p, idx) => idx === 2 ? p.slice(-2) : p).join('/')
          : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
        ctx.font = `bold ${Math.round(9.5 * scaleX)}px "Times New Roman", serif`;
        ctx.fillText(`Date of Issue : ${dateFormattedInt}`, pW / 2, (841.89 - 125.00) * scaleY);
      } else if (lowerId.includes('rashtriya') && (lowerId.includes('gaurav') || lowerId.includes('ratan'))) {
        const scaleX = pW / 595.28;
        const scaleY = pH / 841.89;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO0223');
        const regNo = formData.reg_no || '459383';

        ctx.fillStyle = '#111827';
        const fontSizePx = Math.round(9.0 * scaleX);
        ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`CIN No. - ${cinNo}`, 72.34 * scaleX, (841.89 - 761.23) * scaleY);
        ctx.fillText(`License No. - ${licNo}`, 72.34 * scaleX, (841.89 - 748.63) * scaleY);
        ctx.font = `bold ${fontSizePx}px Arial, Helvetica, sans-serif`;
        ctx.fillText(`Sl. No. - ${slNo}`, 72.34 * scaleX, (841.89 - 736.02) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 72.34 * scaleX, (841.89 - 723.42) * scaleY);

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['rashtriya-gaurav-ratan-samman'], scaleX, scaleY, 841.89, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        const rawName = formData.fullName || 'Recipient Full Name';
        ctx.textAlign = 'center';
        let namePx = Math.round(20.0 * scaleX);
        ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        while (namePx > Math.round(10 * scaleX) && ctx.measureText(rawName).width > 300 * scaleX) {
          namePx -= 1;
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(rawName, pW / 2, (841.89 - 390.70) * scaleY);

        // Dynamic Category / Award Subject
        let rawCat = formData.category || formData.awardSubject || formData.subject || 'Social Work';
        let cleanCat = String(rawCat).trim();
        cleanCat = cleanCat.replace(/^\(+/, '').replace(/\)+$/, '').replace(/\.+$/, '').trim();
        if (!cleanCat) cleanCat = 'Social Work';
        const catStr = `(${cleanCat}).`;

        ctx.textAlign = 'center';
        let catPx = Math.round(13.5 * scaleX);
        ctx.font = `bold ${catPx}px Georgia, "Times New Roman", serif`;
        while (catPx > Math.round(8.0 * scaleX) && ctx.measureText(catStr).width > 320 * scaleX) {
          catPx -= 1;
          ctx.font = `bold ${catPx}px Georgia, "Times New Roman", serif`;
        }
        ctx.fillStyle = '#4d220e';
        ctx.fillText(catStr, pW / 2, (841.89 - 265.60) * scaleY);

        // Date of Issue
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(12.0 * scaleX)}px "Times New Roman", serif`;
        ctx.fillStyle = '#181d32';
        ctx.fillText(`Date of Issue : ${dateFormatted}`, pW / 2, (841.89 - 181.50) * scaleY);
      } else if (lowerId.includes('gaurav') || lowerId.includes('ratan')) {
        const scaleX = pW / 597.224;
        const scaleY = pH / 843.920;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO0223');
        const regNo = formData.reg_no || '459383';

        ctx.fillStyle = '#111827';
        const fontSizePx = Math.round(9.0 * scaleX);
        ctx.font = `${fontSizePx}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`CIN NO:- ${cinNo}`, 86.40 * scaleX, (843.920 - 753.00) * scaleY);
        ctx.fillText(`Licence No:- ${licNo}`, 86.40 * scaleX, (843.920 - 743.00) * scaleY);
        ctx.font = `bold ${fontSizePx}px Arial, Helvetica, sans-serif`;
        ctx.fillText(`Sl. No. ${slNo}`, 86.40 * scaleX, (843.920 - 733.00) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 86.40 * scaleX, (843.920 - 723.00) * scaleY);

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['bhartiya-gaurav-ratan-samman'], scaleX, scaleY, 843.920, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        const rawName = formData.fullName || 'Recipient Full Name';
        ctx.textAlign = 'center';
        let namePx = Math.round(21.0 * scaleX);
        ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        while (namePx > Math.round(10 * scaleX) && ctx.measureText(rawName).width > 280 * scaleX) {
          namePx -= 1;
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        }
        ctx.fillStyle = '#000000';
        ctx.fillText(rawName, pW / 2, (843.920 - 224.50) * scaleY);

        // Date of Issue
        ctx.textAlign = 'center';
        ctx.font = `${Math.round(10.75 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.fillStyle = '#111827';
        ctx.fillText(`Date of Issue : ${dateFormatted}`, 286.36 * scaleX, (843.920 - 130.00) * scaleY);
      } else if (lowerId.includes('shree') || (lowerId.includes('rashtriya') && lowerId.includes('padma'))) {
        const scaleX = pW / 597.2954;
        const scaleY = pH / 843.896;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO0218');
        const regNo = formData.reg_no || '459383';

        ctx.fillStyle = '#111827';
        ctx.font = `${Math.round(10.86 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`CIN NO:- ${cinNo}`, 46.51 * scaleX, (843.896 - 779.08) * scaleY);
        ctx.fillText(`Licence No:- ${licNo}`, 46.51 * scaleX, (843.896 - 766.92) * scaleY);
        ctx.fillText(`Sl. No. ${slNo}`, 46.51 * scaleX, (843.896 - 754.76) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 46.51 * scaleX, (843.896 - 742.60) * scaleY);

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['rashtriya-padma-shree-samman'], scaleX, scaleY, 843.896, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        const rawName = formData.fullName || 'Recipient Full Name';
        ctx.textAlign = 'center';
        let namePx = Math.round(25.5 * scaleX);
        ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        while (namePx > Math.round(11 * scaleX) && ctx.measureText(rawName).width > 280 * scaleX) {
          namePx -= 1;
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        }
        ctx.fillStyle = '#660000';
        ctx.fillText(rawName, pW / 2, (843.896 - 331.56) * scaleY);
      } else if (lowerId.includes('padma')) {
        const scaleX = pW / 597.20;
        const scaleY = pH / 843.92;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO0216');
        const regNo = formData.reg_no || '459383';

        ctx.fillStyle = '#111827';
        ctx.font = `${Math.round(10.86 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(`CIN NO:- ${cinNo}`, 66.0 * scaleX, (843.92 - 768.12) * scaleY);
        ctx.fillText(`Licence No:- ${licNo}`, 66.0 * scaleX, (843.92 - 755.83) * scaleY);
        ctx.fillText(`Sl. No. ${slNo}`, 66.0 * scaleX, (843.92 - 743.43) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 66.0 * scaleX, (843.92 - 730.71) * scaleY);

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['bhartiya-padma-bhushan-samman'], scaleX, scaleY, 843.92, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        const rawName = formData.fullName || 'Recipient Full Name';
        ctx.textAlign = 'center';
        let namePx = Math.round(20.5 * scaleX);
        ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        while (namePx > Math.round(9 * scaleX) && ctx.measureText(rawName).width > 380 * scaleX) {
          namePx -= 1;
          ctx.font = `bold ${namePx}px "Times New Roman", serif`;
        }
        ctx.fillStyle = '#111827';
        ctx.fillText(rawName, pW / 2, (843.92 - 228.00) * scaleY);

        ctx.textAlign = 'left';
        ctx.font = `${Math.round(10.5 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateFormatted, 295.5 * scaleX, (843.92 - 129.5) * scaleY);
      } else if (lowerId.includes('arya') || lowerId.includes('samaj')) {
        const scaleX = pW / 597.28;
        const scaleY = pH / 843.89;

        const cinNo = formData.cin_no || 'U85499DL2025NPL459383';
        const licNo = formData.licence_no || '176566';
        const slNo = formData.serial_no || (formData.refno ? (formData.refno.includes('459383') ? formData.refno : `459383/${formData.refno.replace(/^IHREO\/?/, 'IHREO')}`) : '459383/IHREO2026/154');
        const regNo = formData.reg_no || '459383';

        // Top Left 4 Lines
        ctx.fillStyle = '#111827';
        ctx.textAlign = 'left';
        ctx.font = `${Math.round(8.08 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.fillText(`CIN NO.:- ${cinNo}`, 88.50 * scaleX, (843.89 - 776.17) * scaleY);
        ctx.font = `${Math.round(9.26 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.fillText(`Licence No.:- ${licNo}`, 88.50 * scaleX, (843.89 - 765.22) * scaleY);
        ctx.font = `${Math.round(8.37 * scaleX)}px Arial, Helvetica, sans-serif`;
        ctx.fillText(`Sl. No. ${slNo}`, 88.50 * scaleX, (843.89 - 755.36) * scaleY);
        ctx.fillText(`Reg No. ${regNo}`, 88.50 * scaleX, (843.89 - 746.09) * scaleY);

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['arya-bhushan-samaj-seva-award'], scaleX, scaleY, 843.89, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        // Recipient Name (Italic red over underline at center 337.46, y: 386.51)
        const rawName = formData.fullName || 'Recipient Full Name';
        ctx.textAlign = 'center';
        let namePx = Math.round(24.39 * scaleX);
        ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
        const maxNamePx = 310 * scaleX;
        while (namePx > Math.round(11 * scaleX) && ctx.measureText(rawName).width > maxNamePx) {
          namePx -= 1;
          ctx.font = `italic bold ${namePx}px "Times New Roman", serif`;
        }
        ctx.fillStyle = '#a41212';
        ctx.fillText(rawName, 337.46 * scaleX, (843.89 - 386.51) * scaleY);

        // Award Subject: e.g. Social Worker
        const subjectStr = formData.subject || formData.award_subject || formData.designation || formData.category || 'Social Worker';
        let subjectPx = Math.round(18.0 * scaleX);
        ctx.font = `bold ${subjectPx}px "Times New Roman", serif`;
        while (subjectPx > Math.round(10 * scaleX) && ctx.measureText(subjectStr).width > 400 * scaleX) {
          subjectPx -= 1;
          ctx.font = `bold ${subjectPx}px "Times New Roman", serif`;
        }
        ctx.fillText(subjectStr, pW / 2, (843.89 - 247.79) * scaleY);

        // Issue Date: Date of Issue : DD/MM/YYYY
        const rawDate = formData.letterIssuedAt || formData.issue_date || new Date();
        const dateFormattedArya = typeof rawDate === 'string' && rawDate.includes('-')
          ? rawDate.split('-').reverse().join('/')
          : new Date().toLocaleDateString('en-GB');
        ctx.font = `bold ${Math.round(10.0 * scaleX)}px "Times New Roman", serif`;
        ctx.fillText(`Date of Issue : ${dateFormattedArya}`, pW / 2, (843.89 - 122.50) * scaleY);
      } else if (lowerId.includes('doctorate')) {
        const scaleX = pW / 595.28;
        const scaleY = pH / 841.89;

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['doctorate-ihreo'], scaleX, scaleY, 841.89, formData.focalPoint);
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
      } else if (lowerId.includes('membership')) {
        const scaleX = pW / 597.2754;
        const scaleY = pH / 843.8899;

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['universal-membership-certificate'], scaleX, scaleY, 843.8899, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(16.5 * scaleX)}px "Times New Roman", serif`;
        ctx.fillStyle = '#111827';
        ctx.fillText(name, pW / 2, (843.8899 - 266.5) * scaleY);

        const dateStr = `Date of Issue : ${dateFormatted}`;
        ctx.font = `${Math.round(9.5 * scaleX)}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = '#1f2937';
        ctx.fillText(dateStr, pW / 2, (843.8899 - 181.0) * scaleY);
      } else if (lowerId.includes('id-card') || lowerId.includes('id card')) {
        const scaleX = pW / 270;
        const scaleY = pH / 144;

        if (formData.photoUrl) {
          const pImg = new Image();
          pImg.onload = () => {
            renderPhotoOnCanvas(ctx, pImg, PHOTO_CONFIGS['universal-id-card'], scaleX, scaleY, 144, formData.focalPoint);
          };
          pImg.src = formData.photoUrl;
        }

        ctx.textAlign = 'left';
        ctx.font = `bold ${Math.round(7.5 * scaleX)}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = '#111827';
        ctx.fillText(`: ${formData.fullName || 'Member Name'}`, 114 * scaleX, (144 - 70) * scaleY);
        ctx.fillText(`: ${formData.designation || 'National Member'}`, 114 * scaleX, (144 - 58) * scaleY);
        ctx.fillText(`: ${formData.nationality || 'Indian'}`, 114 * scaleX, (144 - 46) * scaleY);
        ctx.fillText(`: ${dateFormatted}`, 114 * scaleX, (144 - 35) * scaleY);
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
    const isAppreciationOnly = formData.certificateTemplateIds && formData.certificateTemplateIds.length > 0 && formData.certificateTemplateIds.every(tid => String(tid).toLowerCase().includes('appreciation'));
    if (!formData.photoUrl && !isAppreciationOnly) return setError('Recipient photo upload is required.');
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

          {/* CIN Number */}
          <div className="form-group">
            <label className="form-label">CIN Number</label>
            <input
              type="text"
              name="cin_no"
              className="form-control"
              placeholder="e.g. U85499DL2025NPL459383"
              value={formData.cin_no}
              onChange={handleChange}
            />
          </div>

          {/* Licence Number */}
          <div className="form-group">
            <label className="form-label">Licence Number</label>
            <input
              type="text"
              name="licence_no"
              className="form-control"
              placeholder="e.g. 176566"
              value={formData.licence_no}
              onChange={handleChange}
            />
          </div>

          {/* Registration Number */}
          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              name="reg_no"
              className="form-control"
              placeholder="e.g. 459383"
              value={formData.reg_no}
              onChange={handleChange}
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
