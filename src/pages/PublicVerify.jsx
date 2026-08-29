import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const PublicVerify = () => {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Check query parameters e.g. /verify?cert=IHREO/CERT/2026/0006 or ?id=...
    const searchParams = new URLSearchParams(location.search);
    const queryCert = searchParams.get('cert') || searchParams.get('certificateNumber') || searchParams.get('id');

    // 2. Check path parameter e.g. /verify/IHREO%2FCERT%2F2026%2F0006 or /verify/...
    const pathParts = location.pathname.split('/verify/');
    const pathCert = pathParts[1] ? decodeURIComponent(pathParts[1]).replace(/^\/+/, '') : '';

    const certParam = queryCert || pathCert;

    if (certParam) {
      verifyCertificate(certParam);
    } else {
      setLoading(false);
      setError('No certificate number provided in URL.');
    }
  }, [location.pathname, location.search]);

  const verifyCertificate = async (certNumber) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/verify?cert=${encodeURIComponent(certNumber)}`);
      setData(res.data);
    } catch (err) {
      if (err.response && err.response.data) {
        setData(err.response.data);
      } else {
        setError('Failed to reach verification server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const student = data?.student;

  // Format date helper: DD.MM.YYYY or DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Extract registration number and serial number
  const rawRef = student?.refno || '';
  const regNo = rawRef ? rawRef.split('/')[0] : '459383';
  const slNo = rawRef || (student?.certificateNumber ? student.certificateNumber.replace('/CERT/', '/') : '459383/IHREO0201');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ecefe6',
      backgroundImage: 'radial-gradient(#d4dcd2 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 12px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Main Official Document Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#ffffff',
        border: '1.5px solid #222222',
        borderRadius: '2px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', color: '#555555' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#009933',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '15px', fontWeight: 600 }}>Verifying Official Record...</p>
            <p style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>Connecting to IHREO Central Register</p>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 700,
              marginBottom: '14px'
            }}>✕</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>Verification Query Error</h2>
            <p style={{ color: '#666666', fontSize: '13px' }}>{error}</p>
          </div>
        ) : data?.valid ? (
          <div>
            {/* Top Registration Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 18px 6px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#111111'
            }}>
              <span>Reg No. {regNo}</span>
              <span>Sl. No. {slNo}</span>
            </div>

            {/* Organization Header */}
            <div style={{ textAlign: 'center', padding: '6px 16px 12px' }}>
              <h1 style={{
                fontFamily: "'Playfair Display', 'Georgia', 'Times New Roman', serif",
                fontSize: '25px',
                fontWeight: 900,
                color: '#0a0a0a',
                lineHeight: 1.18,
                margin: '0 0 3px 0'
              }}>
                Iconic Human Rights<br />& Educational Organisation
              </h1>
              <p style={{
                fontSize: '11px',
                color: '#333333',
                fontWeight: 500,
                margin: '0 0 12px 0',
                letterSpacing: '0.1px'
              }}>
                Approved by Ministry of Corporate Affairs, Government of India
              </p>

              {/* Award Category Pill */}
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(180deg, #edf2f7 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                borderRadius: '24px',
                padding: '5px 22px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
              }}>
                <span style={{
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '0.2px'
                }}>
                  {student?.category || 'Honorary Doctorate Award'}
                </span>
              </div>
            </div>

            {/* Photo & Details Section with Reduced Opacity Watermark Logo */}
            <div style={{ position: 'relative', padding: '10px 18px 24px', minHeight: '380px' }}>
              {/* High-Resolution IHREO Watermark Logo */}
              <div style={{
                position: 'absolute',
                top: '52%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '340px',
                height: '340px',
                opacity: 0.12,
                pointerEvents: 'none',
                zIndex: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img
                  src="/ihreo-logo.svg"
                  alt="IHREO Official Seal"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    // Fallback to favicon / png if svg not loaded
                    e.currentTarget.src = '/ihreo-logo.png';
                  }}
                />
              </div>

              {/* Foreground Content */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Student Photo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '125px',
                    height: '150px',
                    borderRadius: '8px',
                    border: '1.5px solid #222222',
                    backgroundColor: '#f8fafc',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {student?.photoUrl ? (
                      <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '38px', color: '#94a3b8' }}>👤</span>
                    )}
                  </div>
                </div>

                {/* Details List (Centered, Clean - exactly matching Image 3) */}
                <div style={{
                  textAlign: 'center',
                  fontSize: '16.5px',
                  color: '#111111',
                  fontWeight: 500,
                  lineHeight: 1.75
                }}>
                  {/* Name */}
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: '1px' }}>
                    Name - {student?.fullName || 'N/A'}
                  </div>

                  {/* Guardian / Father's Name */}
                  {student?.fathersHusbandName && (
                    <div>
                      Guardian Name - {student.fathersHusbandName}
                    </div>
                  )}

                  {/* Mobile Number (if present) */}
                  {student?.phoneNumber && (
                    <div>
                      Mobile Number - {student.phoneNumber}
                    </div>
                  )}

                  {/* Email */}
                  {student?.email && (
                    <div>
                      Mail - {student.email}
                    </div>
                  )}

                  {/* Blood Group (if present) */}
                  {student?.bloodGroup && (
                    <div>
                      Blood Group - {student.bloodGroup}
                    </div>
                  )}

                  {/* Date of Birth */}
                  {student?.dateOfBirth && (
                    <div>
                      D.O.B - {formatDate(student.dateOfBirth)}
                    </div>
                  )}

                  {/* Category */}
                  {student?.category && (
                    <div>
                      Category - {student.category}
                    </div>
                  )}

                  {/* Address */}
                  {student?.address && (
                    <div style={{ marginTop: '2px', padding: '0 10px', wordBreak: 'break-word' }}>
                      Address - {student.address}
                    </div>
                  )}

                  {/* Date of Issue */}
                  <div style={{ marginTop: '14px', fontSize: '17px', fontWeight: 600, color: '#000000' }}>
                    Date Of Issue - {formatDateSlash(student?.letterIssuedAt) || formatDateSlash(new Date())}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '54px 24px', textAlign: 'center' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              fontWeight: 700,
              marginBottom: '14px'
            }}>✕</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
              Certificate Record Not Found
            </h2>
            <p style={{ color: '#666666', fontSize: '13.5px', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
              {data?.message || 'No official IHREO certificate matches the scanned QR code or provided number.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicVerify;
