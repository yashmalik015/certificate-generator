import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Crosshair, Save, RefreshCw, Eye, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axiosClient';

const FIELD_TYPES = [
  { key: 'fullName',          label: 'Full Name',           color: '#3b82f6' },
  { key: 'category',          label: 'Category / Award For', color: '#f59e0b' },
  { key: 'refno',             label: 'Reference Number',    color: '#8b5cf6' },
  { key: 'certificateNumber', label: 'Certificate Number',  color: '#ec4899' },
  { key: 'letterIssuedAt',    label: 'Issue Date',          color: '#10b981' },
  { key: 'photo',             label: 'Photo Box',           color: '#ef4444', isBox: true },
  { key: 'qrCode',            label: 'QR Code Box',         color: '#06b6d4', isBox: true },
  { key: 'designation',       label: 'Designation',         color: '#f97316' },
  { key: 'fathersHusbandName',label: 'Father/Husband Name', color: '#84cc16' },
  { key: 'nationality',       label: 'Nationality',         color: '#a78bfa' },
];

const DEFAULT_FONT_SIZE = 36;
const DEFAULT_BOX_SIZE = 200;

const TemplateCalibratorPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 }); // natural pixel dims
  const [renderDims, setRenderDims] = useState({ w: 0, h: 0 }); // displayed dims
  const [markers, setMarkers] = useState({});   // { fieldKey: { x, y, fontSize, align, color, width?, height? } }
  const [activeField, setActiveField] = useState('fullName');
  const [config, setConfig] = useState(null);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);

  const imgContainerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    api.get('/certificate-templates').then((r) => setTemplates(r.data || [])).catch(() => {});
  }, []);

  const loadTemplate = async (templateId) => {
    if (!templateId) { setImgUrl(''); setMarkers({}); setConfig(null); return; }
    setSelectedTemplate(templateId);
    setImgUrl(`/assets/certificate-templates/${encodeURIComponent(templateId)}.png`);
    setMarkers({});
    setLoadingConfig(true);
    try {
      const res = await api.get(`/certificate-templates/${encodeURIComponent(templateId)}/config`);
      if (res.data.exists && res.data.config) {
        const cfg = res.data.config;
        const loaded = {};
        if (cfg.fields) {
          Object.entries(cfg.fields).forEach(([k, v]) => {
            loaded[k] = { x: v.x, y: v.y, fontSize: v.fontSize || DEFAULT_FONT_SIZE, align: v.align || 'center', color: v.color || '#000000', maxWidth: v.maxWidth || 0, wrap: v.wrap || false, font: v.font || 'bold' };
          });
        }
        if (cfg.photo) loaded.photo = { x: cfg.photo.x, y: cfg.photo.y, width: cfg.photo.width || DEFAULT_BOX_SIZE, height: cfg.photo.height || DEFAULT_BOX_SIZE, isBox: true };
        if (cfg.qrCode) loaded.qrCode = { x: cfg.qrCode.x, y: cfg.qrCode.y, width: cfg.qrCode.size || DEFAULT_BOX_SIZE, height: cfg.qrCode.size || DEFAULT_BOX_SIZE, isBox: true };
        setMarkers(loaded);
        setStatus({ type: 'info', text: `Loaded existing config with ${Object.keys(loaded).length} fields.` });
      } else {
        setStatus({ type: 'info', text: 'No existing config found. Click on the template to place field markers.' });
      }
    } catch {
      setStatus({ type: 'info', text: 'Click on the template image to place field markers.' });
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleImgLoad = () => {
    if (imgRef.current) {
      setImgDims({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
      setRenderDims({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
    }
  };

  // Convert click position (within rendered image) → actual pixel coordinates on original template
  const handleImageClick = useCallback((e) => {
    if (!imgRef.current || !imgDims.w) return;
    const rect = imgRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const scaleX = imgDims.w / rect.width;
    const scaleY = imgDims.h / rect.height;
    const px = Math.round(relX * scaleX);
    const py = Math.round(relY * scaleY);

    const fieldDef = FIELD_TYPES.find((f) => f.key === activeField);
    const isBox = fieldDef?.isBox || false;

    setMarkers((prev) => ({
      ...prev,
      [activeField]: {
        ...(prev[activeField] || {}),
        x: px, y: py,
        ...(isBox ? { width: prev[activeField]?.width || DEFAULT_BOX_SIZE, height: prev[activeField]?.height || DEFAULT_BOX_SIZE } : {}),
        ...(!isBox ? { fontSize: prev[activeField]?.fontSize || DEFAULT_FONT_SIZE, align: prev[activeField]?.align || 'center', color: prev[activeField]?.color || '#000000', font: prev[activeField]?.font || 'bold', maxWidth: prev[activeField]?.maxWidth || 0 } : {})
      }
    }));
  }, [activeField, imgDims]);

  const removeMarker = (key) => {
    setMarkers((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const updateMarkerProp = (key, prop, val) => {
    setMarkers((prev) => ({ ...prev, [key]: { ...prev[key], [prop]: val } }));
  };

  // Build config JSON from markers
  const buildConfig = () => {
    const fields = {};
    const photo = markers.photo ? { x: markers.photo.x, y: markers.photo.y, width: markers.photo.width, height: markers.photo.height } : undefined;
    const qrCode = markers.qrCode ? { x: markers.qrCode.x, y: markers.qrCode.y, size: markers.qrCode.width } : undefined;

    Object.entries(markers).forEach(([k, v]) => {
      if (k === 'photo' || k === 'qrCode') return;
      fields[k] = { x: v.x, y: v.y, fontSize: v.fontSize, font: v.font || 'bold', color: v.color, align: v.align };
      if (v.maxWidth) fields[k].maxWidth = v.maxWidth;
      if (v.wrap) fields[k].wrap = true;
    });

    return { templateFile: `${selectedTemplate}.png`, fields, ...(photo ? { photo } : {}), ...(qrCode ? { qrCode } : {}) };
  };

  const saveConfig = async () => {
    if (!selectedTemplate) { setStatus({ type: 'error', text: 'Select a template first.' }); return; }
    if (Object.keys(markers).length === 0) { setStatus({ type: 'error', text: 'Place at least one field marker before saving.' }); return; }
    setSaving(true);
    try {
      const cfg = buildConfig();
      await api.put(`/certificate-templates/${encodeURIComponent(selectedTemplate)}/config`, cfg);
      setConfig(cfg);
      setStatus({ type: 'success', text: `✅ Config saved for "${selectedTemplate}" (${Object.keys(markers).length} fields).` });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.error || 'Failed to save config.' });
    } finally {
      setSaving(false);
    }
  };

  // Scale factor for showing markers on the displayed image
  const scaleX = imgDims.w ? renderDims.w / imgDims.w : 1;
  const scaleY = imgDims.h ? renderDims.h / imgDims.h : 1;

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={20} style={{ color: 'var(--primary-accent)' }} />
            Template Calibrator
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Click on a template image to place field coordinate markers. Markers are saved as JSON configs used during certificate generation.
          </div>
        </div>

        {status.text && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
            background: status.type === 'success' ? 'rgba(16,185,129,0.15)' : status.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
            color: status.type === 'success' ? 'var(--success)' : status.type === 'error' ? 'var(--danger)' : '#60a5fa',
            border: `1px solid ${status.type === 'success' ? 'rgba(16,185,129,0.3)' : status.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`
          }}>
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '280px' }}>
            <label className="form-label">Select Template</label>
            <select className="form-control" value={selectedTemplate} onChange={(e) => loadTemplate(e.target.value)}>
              <option value="">-- Choose a certificate template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={saveConfig} disabled={saving || !selectedTemplate}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Config'}
          </button>
          <button className="btn btn-outline" onClick={() => loadTemplate(selectedTemplate)} disabled={!selectedTemplate}>
            <RefreshCw size={16} /> Reload
          </button>
        </div>
      </div>

      {selectedTemplate && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Left panel — field selector + marker list */}
          <div>
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><h3 className="card-title" style={{ fontSize: '14px' }}>1. Choose Field to Place</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FIELD_TYPES.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveField(f.key)}
                    style={{
                      padding: '8px 12px', borderRadius: '6px', border: `2px solid ${activeField === f.key ? f.color : 'transparent'}`,
                      background: activeField === f.key ? `${f.color}20` : 'var(--bg-input)',
                      color: activeField === f.key ? f.color : 'var(--text-secondary)',
                      cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: activeField === f.key ? 700 : 400,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    {f.label}
                    {markers[f.key] && <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--success)' }}>✓</span>}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-input)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                2. Click anywhere on the template image to drop the marker for the selected field.
              </div>
            </div>

            {/* Placed markers — edit properties */}
            {Object.keys(markers).length > 0 && (
              <div className="card">
                <div className="card-header"><h3 className="card-title" style={{ fontSize: '14px' }}>Placed Markers</h3></div>
                {Object.entries(markers).map(([key, val]) => {
                  const fieldDef = FIELD_TYPES.find((f) => f.key === key);
                  const isBox = fieldDef?.isBox;
                  return (
                    <div key={key} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: fieldDef?.color }}>{fieldDef?.label || key}</span>
                        <button onClick={() => removeMarker(key)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>x: {val.x}, y: {val.y}</div>
                      {isBox ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>W (px)</label>
                            <input type="number" className="form-control" style={{ padding: '4px', fontSize: '12px' }} value={val.width || 200} onChange={(e) => updateMarkerProp(key, 'width', Number(e.target.value))} /></div>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>H (px)</label>
                            <input type="number" className="form-control" style={{ padding: '4px', fontSize: '12px' }} value={val.height || 200} onChange={(e) => updateMarkerProp(key, 'height', Number(e.target.value))} /></div>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font size</label>
                            <input type="number" className="form-control" style={{ padding: '4px', fontSize: '12px' }} value={val.fontSize || 36} onChange={(e) => updateMarkerProp(key, 'fontSize', Number(e.target.value))} /></div>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Align</label>
                            <select className="form-control" style={{ padding: '4px', fontSize: '12px' }} value={val.align || 'center'} onChange={(e) => updateMarkerProp(key, 'align', e.target.value)}>
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select></div>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Color</label>
                            <input type="color" style={{ width: '100%', height: '30px', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-color)' }} value={val.color || '#000000'} onChange={(e) => updateMarkerProp(key, 'color', e.target.value)} /></div>
                          <div><label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max Width</label>
                            <input type="number" className="form-control" style={{ padding: '4px', fontSize: '12px' }} value={val.maxWidth || 0} placeholder="0 = none" onChange={(e) => updateMarkerProp(key, 'maxWidth', Number(e.target.value))} /></div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input type="checkbox" checked={val.wrap || false} onChange={(e) => updateMarkerProp(key, 'wrap', e.target.checked)} />
                              Word-wrap text
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel — template image with markers */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '14px' }}>
                <Eye size={16} style={{ marginRight: '6px', color: 'var(--primary-accent)' }} />
                {selectedTemplate} — click to place marker for <span style={{ color: FIELD_TYPES.find(f => f.key === activeField)?.color }}>{FIELD_TYPES.find(f => f.key === activeField)?.label}</span>
              </h3>
            </div>
            <div ref={imgContainerRef} style={{ position: 'relative', cursor: 'crosshair', userSelect: 'none', lineHeight: 0 }}>
              {loadingConfig && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'white', fontSize: '14px' }}>
                  Loading config...
                </div>
              )}
              <img
                ref={imgRef}
                src={imgUrl}
                alt={selectedTemplate}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '6px' }}
                onLoad={handleImgLoad}
                onClick={handleImageClick}
                draggable={false}
              />
              {/* Render markers as overlays */}
              {Object.entries(markers).map(([key, val]) => {
                const fieldDef = FIELD_TYPES.find((f) => f.key === key);
                const dispX = val.x * scaleX;
                const dispY = val.y * scaleY;
                const isBox = fieldDef?.isBox;
                return isBox ? (
                  <div key={key} style={{
                    position: 'absolute',
                    left: dispX, top: dispY,
                    width: (val.width || DEFAULT_BOX_SIZE) * scaleX,
                    height: (val.height || DEFAULT_BOX_SIZE) * scaleY,
                    border: `2px dashed ${fieldDef?.color}`,
                    background: `${fieldDef?.color}18`,
                    pointerEvents: 'none'
                  }}>
                    <span style={{ position: 'absolute', top: 0, left: 0, fontSize: '9px', background: fieldDef?.color, color: 'white', padding: '1px 4px', borderRadius: '0 0 4px 0' }}>{fieldDef?.label}</span>
                  </div>
                ) : (
                  <div key={key} style={{
                    position: 'absolute',
                    left: dispX - 6, top: dispY - 6,
                    width: 12, height: 12,
                    background: fieldDef?.color,
                    borderRadius: '50%',
                    border: '2px solid white',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ position: 'absolute', left: '16px', top: '-2px', whiteSpace: 'nowrap', fontSize: '10px', background: `${fieldDef?.color}dd`, color: 'white', padding: '1px 6px', borderRadius: '4px' }}>
                      {fieldDef?.label} ({val.x},{val.y})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!selectedTemplate && (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          <Crosshair size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>Select a template above to start calibrating</p>
          <p style={{ fontSize: '13px' }}>Click on the template image to drop coordinate markers for each dynamic field (name, category, photo, QR code, etc.)</p>
        </div>
      )}
    </div>
  );
};

export default TemplateCalibratorPage;
