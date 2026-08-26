import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Award, CheckCircle2, AlertTriangle, XCircle, Calendar, ShieldCheck, Building2, User } from 'lucide-react';
import axios from 'axios';

const PublicVerify = () => {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Extract certificate number from path e.g. /verify/WCAEO%2FCERT%2F2026%2F0001 or /verify/...
    const pathParts = location.pathname.split('/verify/');
    const certParam = pathParts[1] ? decodeURIComponent(pathParts[1]) : '';

    if (certParam) {
      verifyCertificate(certParam);
    } else {
      setLoading(false);
      setError('No certificate number provided in URL.');
    }
  }, [location.pathname]);

  const verifyCertificate = async (certNumber) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/verify/${encodeURIComponent(certNumber)}`);
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

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1e293b 0%, #0b0f19 100%)', color: '#f8fafc', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Institution Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '700px' }}>
        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #f59e0b, #b45309)', borderRadius: '16px', display: 'flex', alignItems: 'center', justify: 'center', color: '#ffffff', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)' }}>
          <Award size={36} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '0.5px', color: '#ffffff', marginBottom: '6px' }}>
          WORLD COUNCIL OF ACADEMIC & EDUCATIONAL ORGANIZATIONS
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
          Official International Award Verification Registry (WCAEO)
        </p>
      </div>

      {/* Verification Result Container */}
      <div style={{ width: '100%', maxWidth: '640px', background: '#131b2e', border: '1px solid #23304c', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
            <p style={{ fontSize: '16px' }}>Verifying certificate authenticity against WCAEO Registry...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <XCircle size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Verification Query Error</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{error}</p>
          </div>
        ) : data?.valid ? (
          <div>
            {/* Success Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.3))', borderBottom: '1px solid rgba(16, 185, 129, 0.3)', padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#10b981', color: '#000000', padding: '8px 20px', borderRadius: '30px', fontWeight: 700, fontSize: '14px', marginBottom: '12px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
                <CheckCircle2 size={18} /> OFFICIAL CERTIFICATE VERIFIED
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Authentic WCAEO Honor & Award Record</h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                This record has been officially authenticated and confirmed in the WCAEO central register.
              </p>
            </div>

            {/* Recipient Details */}
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #23304c' }}>
                {student?.photoUrl ? (
                  <img src={student.photoUrl} alt={student.fullName} style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '3px solid #f59e0b', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
                ) : (
                  <div style={{ width: '90px', height: '90px', borderRadius: '12px', background: '#1a233a', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#94a3b8' }}>
                    <User size={40} />
                  </div>
                )}
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{student?.fullName}</h3>
                  {student?.fathersHusbandName && <p style={{ fontSize: '13px', color: '#94a3b8' }}>S/D/W of: {student.fathersHusbandName}</p>}
                  <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <ShieldCheck size={14} /> Active Certificate
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Certificate Number</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', wordBreak: 'break-all' }}>{student?.certificateNumber}</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Reference Number</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{student?.refno}</div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Award Category</div>
                  <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '15px' }}>{student?.category}</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Event / Ceremony</div>
                  <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{student?.eventName}</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Subject Discipline</div>
                  <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{student?.subjectName}</div>
                </div>

                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>Date of Issue</div>
                  <div style={{ fontWeight: 500, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: '#94a3b8' }} />
                    {student?.letterIssuedAt ? new Date(student.letterIssuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : data?.status === 'Inactive' ? (
          <div>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '24px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#ef4444', color: '#ffffff', padding: '8px 20px', borderRadius: '30px', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>
                <AlertTriangle size={18} /> CERTIFICATE REVOKED / INACTIVE
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Status: Inactive</h2>
              <p style={{ fontSize: '13px', color: '#fca5a5', marginTop: '4px' }}>
                This certificate reference was previously recorded but is currently set to Inactive or Revoked state.
              </p>
            </div>
            {student && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#cbd5e1', fontSize: '14px' }}>
                <p><strong>Recipient:</strong> {student.fullName}</p>
                <p style={{ marginTop: '4px' }}><strong>Cert No:</strong> {student.certificateNumber}</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <XCircle size={56} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>Certificate Record Not Found</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '440px', margin: '0 auto' }}>
              {data?.message || 'No official WCAEO certificate matches the provided certificate number.'}
            </p>
          </div>
        )}

        {/* Footer info */}
        <div style={{ background: '#0b0f19', padding: '16px 24px', borderTop: '1px solid #23304c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} /> WCAEO Honors Council
          </div>
          <div>Official Seal & Authenticated Record</div>
        </div>
      </div>
    </div>
  );
};

export default PublicVerify;
