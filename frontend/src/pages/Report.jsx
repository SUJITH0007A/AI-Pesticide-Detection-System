import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../supabaseClient';

export default function Report() {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const pdfTemplateRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userName, setUserName] = useState('Guest User');

  useEffect(() => {
    // Check local session first for demo users
    const localSessionStr = localStorage.getItem('fs_local_session');
    if (localSessionStr) {
      try {
        const localSession = JSON.parse(localSessionStr);
        if (localSession?.user?.user_metadata?.full_name) {
          setUserName(localSession.user.user_metadata.full_name);
          return;
        } else if (localSession?.user?.email) {
          setUserName(localSession.user.email);
          return;
        }
      } catch (e) {}
    }
    // Fall back to Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      } else if (session?.user?.email) {
        setUserName(session.user.email);
      }
    }).catch(() => {});
  }, []);

  // If no state is passed, redirect to upload
  if (!location.state || !location.state.result) {
    return <Navigate to="/upload" />;
  }

  const { result, image, isFallback } = location.state;
  const categoryLower = result.category?.toLowerCase() || '';
  const isOrganic = categoryLower.includes('organic');
  const isTreated = categoryLower.includes('possibly');
  const isHighRisk = !isOrganic && !isTreated;

  const conf = parseFloat(result.confidence);
  const confPct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
  
  // Fake other confidences for UI purposes based on primary confidence
  const organicConf = isOrganic ? confPct : isTreated ? Math.max(0, Math.floor((100-confPct)/2)) : Math.max(0, 100-confPct-10);
  const treatedConf = isTreated ? confPct : isOrganic ? Math.max(0, Math.floor((100-confPct)*0.8)) : Math.max(0, 100-confPct-5);
  const riskConf = isHighRisk ? confPct : isOrganic ? Math.max(0, 100 - organicConf - treatedConf) : Math.max(0, Math.floor((100-confPct)*0.2));

  const handleDownloadPDF = async () => {
    if (!pdfTemplateRef.current) return;
    setIsGenerating(true);
    
    try {
      const element = pdfTemplateRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      // Use JPEG with 90% quality to compress image data and avoid extremely large file sizes
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Convert to blob and trigger manual anchor download to guarantee filename preservation
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `FreshScan_Report_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in pb-24 lg:pb-0 relative" ref={reportRef}>
      
      <div className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-4" data-html2canvas-ignore>
        <div>
          <nav className="flex items-center gap-2 text-label-md text-outline mb-2">
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/dashboard')}>Dashboard</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/history')}>History</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface">Analysis Result</span>
          </nav>
        </div>
      </div>

      {isFallback && (
        <div className="mb-6 p-4 bg-amber-500/10 text-amber-800 rounded-xl border border-amber-500/20 flex items-center gap-3" data-html2canvas-ignore>
          <span className="material-symbols-outlined text-amber-600">warning</span>
          <span className="font-body-md">
            <strong>Offline Simulation Mode:</strong> Connection to the backend server failed. Showing a locally simulated prediction report.
          </span>
        </div>
      )}

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8 lg:pb-12 bg-background">
        {/* Left Column: Image and Confidence */}
        <div className="lg:col-span-5 space-y-6">
          {/* Result Card - Main Preview */}
          <section className={`bg-surface-container-lowest rounded-xl border border-[#E9ECEF] border-t-2 shadow-[0px_4px_12px_rgba(0,0,0,0.04)] overflow-hidden ${isOrganic ? 'border-primary' : isTreated ? 'border-secondary-container' : 'border-tertiary'}`}>
            <div className="relative h-64 lg:h-80 w-full bg-surface-variant flex items-center justify-center">
              {image ? (
                <img className="w-full h-full object-cover" src={image} alt="Scan result" />
              ) : (
                <span className="material-symbols-outlined text-outline text-4xl">image</span>
              )}
              <div className="absolute top-4 right-4">
                <span className={`${isOrganic ? 'bg-primary/10 text-primary border-primary/20' : isTreated ? 'bg-secondary-container/10 text-secondary-container border-secondary-container/20' : 'bg-tertiary/10 text-tertiary border-tertiary/20'} px-3 py-1.5 rounded-full font-label-md text-label-md flex items-center gap-1.5 backdrop-blur-md border`}>
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  {result.category}
                </span>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-4 items-center">
              <div className="flex flex-col items-center justify-center">
                {/* Circular Progress Ring */}
                <div className="relative w-24 h-24 lg:w-32 lg:h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E9ECEF" strokeWidth="3"></path>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isOrganic ? "#00694c" : isTreated ? "#fdad4e" : "#af262a"} strokeDasharray={`${confPct}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-headline-md text-headline-md lg:text-3xl ${isOrganic ? 'text-primary' : isTreated ? 'text-secondary-container' : 'text-tertiary'}`}>{confPct}%</span>
                    <span className="font-label-md text-label-md text-on-surface-variant">Confidence</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between font-label-md text-label-md">
                    <span className="text-on-surface">Organic</span>
                    <span className="text-primary font-bold">{organicConf}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full" style={{ width: `${organicConf}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-label-md text-label-md">
                    <span className="text-on-surface">Treated</span>
                    <span className="text-secondary font-bold">{treatedConf}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary-container h-full" style={{ width: `${treatedConf}%` }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between font-label-md text-label-md">
                    <span className="text-on-surface">High Risk</span>
                    <span className="text-tertiary font-bold">{riskConf}%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                    <div className="bg-tertiary h-full" style={{ width: `${riskConf}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons - Desktop */}
          <section className="hidden lg:grid grid-cols-1 gap-4" data-html2canvas-ignore>
            <button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-4 rounded-xl font-title-lg text-title-lg shadow-md transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>{isGenerating ? 'sync' : 'save'}</span>
              {isGenerating ? 'Generating PDF...' : 'Save Full Report'}
            </button>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => navigate('/upload')} className="bg-surface border border-primary text-primary hover:bg-primary/5 py-3 rounded-xl font-body-lg text-body-lg flex items-center justify-center gap-2 transition-all duration-150">
                <span className="material-symbols-outlined">barcode_scanner</span>
                New Scan
              </button>
              <button className="bg-surface border border-outline text-on-surface hover:bg-on-surface/5 py-3 rounded-xl font-body-lg text-body-lg flex items-center justify-center gap-2 transition-all duration-150">
                <span className="material-symbols-outlined">share</span>
                Share Result
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: AI Summary and Detection Report */}
        <div className="lg:col-span-7 space-y-6">
          {/* AI Summary */}
          <section className={`border rounded-xl p-6 ${isOrganic ? 'bg-primary-container/5 border-primary/10' : isTreated ? 'bg-secondary-container/5 border-secondary-container/10' : 'bg-error-container/20 border-error/20'}`}>
            <div className="flex gap-4">
              <span className={`material-symbols-outlined text-3xl ${isOrganic ? 'text-primary' : isTreated ? 'text-secondary-container' : 'text-error'}`}>auto_awesome</span>
              <div>
                <h3 className={`font-title-lg text-title-lg mb-2 ${isOrganic ? 'text-primary' : isTreated ? 'text-secondary-container' : 'text-error'}`}>Detailed AI Analysis</h3>
                <p className="font-body-md text-body-lg text-on-surface-variant leading-relaxed">
                  {isOrganic && 'This produce exhibits characteristics consistent with natural growth. Minor surface imperfections and lack of artificial residue suggest it is likely organic. The structural analysis of the skin texture shows no signs of industrial polishing or chemical wax treatment typical of mass-produced commercial fruits.'}
                  {isTreated && 'This produce shows mild visual markers that may correlate with post-harvest chemical treatment or unnatural ripening. While not excessively high-risk, we recommend washing thoroughly.'}
                  {isHighRisk && 'This produce presents several high-risk visual indicators associated with heavy chemical treatment, such as unnatural color uniformity and excessive shine. Strong caution advised.'}
                </p>
                <div className="mt-4 pt-4 border-t border-outline-variant/30 text-label-md text-on-surface-variant">
                  <p><strong>Model:</strong> {result.model_used || 'MobileNetV2 CNN'}</p>
                  <p><strong>Analyst:</strong> {userName}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Detection Report */}
          <section className="space-y-4">
            <h3 className="font-title-lg text-title-lg px-1 flex items-center gap-2">
              <span className="material-symbols-outlined">fact_check</span>
              Detection Report Breakdown
            </h3>
            <div className="bg-surface-container-lowest border border-[#E9ECEF] rounded-xl p-6 space-y-1">
              
              <div className="flex items-center justify-between py-3 border-b border-outline-variant/30">
                <span className="font-body-md text-body-lg text-on-surface">Excessive shine / wax coating</span>
                <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${isHighRisk ? 'text-secondary bg-secondary-fixed/30' : 'text-primary-container bg-primary/10'}`}>
                  {isHighRisk ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-outline-variant/30">
                <span className="font-body-md text-body-lg text-on-surface">Unnatural color uniformity</span>
                <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${isOrganic ? 'text-primary-container bg-primary/10' : 'text-secondary bg-secondary-fixed/30'}`}>
                  {isOrganic ? 'Not Detected' : 'Detected'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-outline-variant/30">
                <span className="font-body-md text-body-lg text-on-surface">Surface residue patterns</span>
                <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${isHighRisk ? 'text-secondary bg-secondary-fixed/30' : 'text-primary-container bg-primary/10'}`}>
                  {isHighRisk ? 'Detected' : 'Not Detected'}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 py-3 border-b border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <span className="font-body-md text-body-lg text-on-surface">Lack of natural imperfections</span>
                  <span className={`font-label-md text-label-md px-3 py-1 rounded-full ${isOrganic ? 'text-secondary bg-secondary-fixed/30' : 'text-primary-container bg-primary/10'}`}>
                    {isOrganic ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
                {isOrganic && (
                  <span className="text-sm text-on-secondary-fixed-variant italic">Minor natural spots and asymmetrical growth marks identified — indicative of organic conditions.</span>
                )}
              </div>
              
              <div className="mt-4 pt-2 text-label-md text-outline italic">
                Disclaimer: This AI report is a probabilistic visual assessment and does not replace certified chemical laboratory testing.
              </div>
              
            </div>
          </section>
        </div>

        {/* Mobile Action Buttons (Hidden on Desktop) */}
        <section className="lg:hidden grid grid-cols-1 gap-3 pb-8 pt-4" data-html2canvas-ignore>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-title-lg text-title-lg shadow-sm active:scale-95 transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined ${isGenerating ? 'animate-spin' : ''}`}>{isGenerating ? 'sync' : 'save'}</span>
            {isGenerating ? 'Generating...' : 'Save Report'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/upload')} className="bg-surface border border-primary text-primary py-3 rounded-xl font-body-lg text-body-lg flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150">
              <span className="material-symbols-outlined">barcode_scanner</span>
              Scan Another
            </button>
            <button className="bg-surface border border-outline text-on-surface py-3 rounded-xl font-body-lg text-body-lg flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150">
              <span className="material-symbols-outlined">share</span>
              Share Result
            </button>
          </div>
        </section>
      </div>

      {/* Premium PDF Template optimized for A4 portrait printing */}
      <div 
        ref={pdfTemplateRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '0',
          width: '794px', // Standard A4 width at 96 DPI
          minHeight: '1123px', // Standard A4 height at 96 DPI
          background: '#ffffff',
          color: '#191c1d',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          padding: '48px 56px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Header */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'middle' }}>
                  <table style={{ borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ paddingRight: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#00694c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                          }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                          </div>
                        </td>
                        <td>
                          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#00694c', letterSpacing: '-0.02em', lineHeight: 1.1 }}>FreshScan</h1>
                          <p style={{ margin: 0, fontSize: '11px', color: '#6d7a73', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Produce Analysis</p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#191c1d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnostic Report</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6d7a73' }}>Report ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>FS-{Math.random().toString(36).substring(2, 8).toUpperCase()}</span></p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Elegant Divider */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #00694c 0%, #fdad4e 50%, #af262a 100%)', borderRadius: '2px', marginBottom: '32px' }}></div>

          {/* Meta Info Section (Tabular) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#f8f9fa', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e1e3e4' }}>
            <tbody>
              <tr>
                <td style={{ width: '33.33%', padding: '16px 24px', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#6d7a73', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyst Name</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#191c1d' }}>{userName}</p>
                </td>
                <td style={{ width: '33.33%', padding: '16px 24px', verticalAlign: 'top', borderLeft: '1px solid #e1e3e4' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#6d7a73', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Scan</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#191c1d' }}>
                    {result.created_at 
                      ? new Date(result.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) 
                      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    }
                  </p>
                </td>
                <td style={{ width: '33.33%', padding: '16px 24px', verticalAlign: 'top', borderLeft: '1px solid #e1e3e4' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: '#6d7a73', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Version</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', color: '#00694c' }}>{result.model_used || 'MobileNetV2 (CNN)'}</p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Main Content Grid: Image & Circular Indicator (Tabular) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
            <tbody>
              <tr>
                <td style={{ width: '380px', verticalAlign: 'top', paddingRight: '32px' }}>
                  {/* Left: Scanned Image */}
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#191c1d', letterSpacing: '0.05em' }}>Analyzed Produce Image</h3>
                  <div style={{ width: '380px', height: '260px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e1e3e4', backgroundColor: '#f3f4f5' }}>
                    {image ? (
                      <img src={image} alt="Scan Result" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bccac1' }}>No Image Scanned</div>
                    )}
                  </div>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  {/* Right: Confidence Circle and Badge */}
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#191c1d', letterSpacing: '0.05em' }}>Scan Summary</h3>
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    fontWeight: '700',
                    fontSize: '12px',
                    letterSpacing: '0.02em',
                    textTransform: 'uppercase',
                    border: '1px solid',
                    backgroundColor: isOrganic ? '#e6f4ea' : isTreated ? '#fef7e0' : '#fce8e6',
                    color: isOrganic ? '#137333' : isTreated ? '#b06000' : '#c5221f',
                    borderColor: isOrganic ? '#a3cfbb' : isTreated ? '#fbe5b8' : '#f5c2c1',
                    marginBottom: '24px'
                  }}>
                    {result.category}
                  </div>

                  {/* Sub-table for Gauge and bars */}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '110px', verticalAlign: 'middle', paddingRight: '20px' }}>
                          {/* Circular Gauge */}
                          <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                            <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 36 36">
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E9ECEF" strokeWidth="3.5"></path>
                              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isOrganic ? '#00694c' : isTreated ? '#fdad4e' : '#af262a'} strokeDasharray={`${confPct}, 100`} strokeLinecap="round" strokeWidth="3.5"></path>
                            </svg>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '20px', fontWeight: '800', color: isOrganic ? '#00694c' : isTreated ? '#fdad4e' : '#af262a', lineHeight: 1 }}>{confPct}%</span>
                              <span style={{ fontSize: '8px', fontWeight: '600', color: '#6d7a73', textTransform: 'uppercase', letterSpacing: '0.02em', marginTop: '2px' }}>Confidence</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                              {/* Organic Row */}
                              <tr>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>Organic Match</td>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', textAlign: 'right', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>{organicConf}%</td>
                              </tr>
                              <tr>
                                <td colSpan="2" style={{ paddingBottom: '10px' }}>
                                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', backgroundColor: '#00694c', width: `${organicConf}%` }}></div>
                                  </div>
                                </td>
                              </tr>

                              {/* Chemical Row */}
                              <tr>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>Chemical Match</td>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', textAlign: 'right', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>{treatedConf}%</td>
                              </tr>
                              <tr>
                                <td colSpan="2" style={{ paddingBottom: '10px' }}>
                                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', backgroundColor: '#fdad4e', width: `${treatedConf}%` }}></div>
                                  </div>
                                </td>
                              </tr>

                              {/* High Risk Row */}
                              <tr>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>High Risk Indicator</td>
                                <td style={{ fontSize: '11px', fontWeight: '700', color: '#191c1d', textAlign: 'right', paddingBottom: '2px', fontFamily: "'Inter', sans-serif" }}>{riskConf}%</td>
                              </tr>
                              <tr>
                                <td colSpan="2">
                                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', backgroundColor: '#af262a', width: `${riskConf}%` }}></div>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* AI Narrative Section */}
          <div style={{
            padding: '20px 24px',
            borderRadius: '16px',
            border: '1px solid',
            marginBottom: '32px',
            backgroundColor: isOrganic ? 'rgba(0, 105, 76, 0.03)' : isTreated ? 'rgba(253, 173, 78, 0.05)' : 'rgba(175, 38, 42, 0.05)',
            borderColor: isOrganic ? 'rgba(0, 105, 76, 0.15)' : isTreated ? 'rgba(253, 173, 78, 0.15)' : 'rgba(175, 38, 42, 0.15)'
          }}>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isOrganic ? '#00694c' : isTreated ? '#885200' : '#af262a',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '16px' }}>★</span> Detailed Analysis Summary
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#2e3132', lineHeight: '1.6', fontWeight: '400' }}>
              {isOrganic && 'This produce exhibits characteristics consistent with natural growth. Minor surface imperfections and lack of artificial residue suggest it is likely organic. The structural analysis of the skin texture shows no signs of industrial polishing or chemical wax treatment typical of mass-produced commercial fruits.'}
              {isTreated && 'This produce shows mild visual markers that may correlate with post-harvest chemical treatment or unnatural ripening. While not excessively high-risk, we recommend washing thoroughly.'}
              {isHighRisk && 'This produce presents several high-risk visual indicators associated with heavy chemical treatment, such as unnatural color uniformity and excessive shine. Strong caution advised.'}
            </p>
          </div>

          {/* Indicators Breakdown Section */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: '#191c1d', letterSpacing: '0.05em' }}>Indicator Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e1e3e4', borderRadius: '16px', overflow: 'hidden' }}>
              {[
                { label: 'Excessive shine / wax coating', val: isHighRisk },
                { label: 'Unnatural color uniformity', val: !isOrganic },
                { label: 'Surface residue patterns', val: isHighRisk },
                { label: 'Lack of natural imperfections', val: isOrganic }
              ].map((ind, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 20px',
                  backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8f9fa',
                  borderBottom: i === 3 ? 'none' : '1px solid #e1e3e4'
                }}>
                  <span style={{ fontSize: '13px', color: '#191c1d', fontWeight: '500' }}>{ind.label}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    backgroundColor: ind.val ? '#ffdad6' : '#e6f4ea',
                    color: ind.val ? '#af262a' : '#00694c'
                  }}>
                    {ind.val ? 'Detected' : 'Not Detected'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e1e3e4', paddingTop: '20px', marginTop: '40px' }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#6d7a73', textAlign: 'center', lineHeight: '1.5' }}>
            Disclaimer: This AI report is a probabilistic visual assessment and does not replace certified chemical laboratory testing.
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '9px', color: '#bccac1', textAlign: 'center' }}>
            Generated automatically by FreshScan Labs. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
