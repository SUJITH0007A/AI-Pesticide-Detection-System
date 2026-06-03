import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Profile({ session }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    organic: 0,
    treated: 0,
    highRisk: 0,
    organicPct: 0,
    treatedPct: 0
  });
  
  const userEmail = session?.user?.email || 'Guest User';
  const userName = session?.user?.user_metadata?.full_name || userEmail.split('@')[0];
  const joinDate = session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown';

  useEffect(() => {
    async function fetchStats() {
      if (!session) return;
      try {
        let predictionsData = [];
        const isLocalUser = session.user?.id === 'local-user-id';

        if (isLocalUser) {
          const localData = localStorage.getItem('fs_local_predictions');
          predictionsData = localData ? JSON.parse(localData) : [];
        } else {
          try {
            const { data, error } = await supabase
              .from('predictions')
              .select('category')
              .eq('user_id', session.user.id);
              
            if (error) throw error;
            predictionsData = data || [];
          } catch (dbErr) {
            console.warn("Failed to fetch profile stats from Supabase. Falling back to local storage:", dbErr);
            const localData = localStorage.getItem('fs_local_predictions');
            predictionsData = localData ? JSON.parse(localData) : [];
          }
        }
        
        const total = predictionsData.length;
        let organic = 0;
        let treated = 0;
        let highRisk = 0;
        
        predictionsData.forEach(item => {
          const cat = item.category?.toLowerCase() || '';
          if (cat.includes('organic')) organic++;
          else if (cat.includes('possibly')) treated++;
          else highRisk++;
        });
        
        setStats({
          total,
          organic,
          treated,
          highRisk,
          organicPct: total > 0 ? Math.round((organic / total) * 100) : 0,
          treatedPct: total > 0 ? Math.round((treated / total) * 100) : 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }
    fetchStats();
  }, [session]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Error signing out from Supabase", e);
    }
    localStorage.removeItem('fs_local_session');
    navigate('/login');
    window.location.reload();
  };

  const handleExport = async () => {
    if (!session) return;
    try {
      let predictionsData = [];
      const isLocalUser = session.user?.id === 'local-user-id';

      if (isLocalUser) {
        const localData = localStorage.getItem('fs_local_predictions');
        predictionsData = localData ? JSON.parse(localData) : [];
      } else {
        try {
          const { data, error } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          predictionsData = data || [];
        } catch (dbErr) {
          console.warn("Failed to export from Supabase. Falling back to local storage:", dbErr);
          const localData = localStorage.getItem('fs_local_predictions');
          predictionsData = localData ? JSON.parse(localData) : [];
        }
      }
      
      if (predictionsData && predictionsData.length > 0) {
        const headers = ['Date', 'Category', 'Confidence', 'Model Used'];
        const rows = predictionsData.map(row => [
          new Date(row.created_at).toLocaleString(),
          `"${row.category}"`,
          row.confidence,
          `"${row.model_used}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");
          
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "FreshScan_History.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("No data available to export.");
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      alert('Failed to export data.');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Profile Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface-container shadow-sm bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-5xl">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-on-primary rounded-full p-1 border-2 border-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">verified</span>
            </div>
          </div>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{userName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-secondary-container/20 text-on-secondary-container text-label-md px-3 py-1 rounded-full font-bold uppercase tracking-tight">Pro Plan</span>
              <span className="text-on-surface-variant text-body-md">• Joined {joinDate}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface border border-outline-variant px-6 py-2.5 rounded-xl font-label-md text-primary hover:bg-surface-container-low transition-colors shadow-sm">Edit Profile</button>
        </div>
      </header>

      {/* Scan Statistics Bento Grid */}
      <section className="mb-12">
        <h3 className="font-title-lg text-title-lg text-on-surface mb-6">Scan Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
          {/* Large Card: Total Lifetime Scans */}
          <div className="md:col-span-4 lg:col-span-3 bg-surface border border-[#E9ECEF] rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-[0px_4px_12px_rgba(0,0,0,0.04)] h-56">
            <div className="relative z-10">
              <p className="text-label-md text-on-surface-variant font-bold uppercase tracking-widest mb-2">Total Lifetime Scans</p>
              <h4 className="text-[64px] font-extrabold text-primary leading-none">{stats.total}</h4>
            </div>
            <div className="absolute top-0 right-0 h-full w-1/2 opacity-5 pointer-events-none transform translate-x-4 rotate-6 flex items-center justify-center">
              <span className="material-symbols-outlined text-[200px]">barcode_scanner</span>
            </div>
          </div>

          {/* Medium Card: Organic */}
          <div className="md:col-span-2 lg:col-span-3 bg-surface border-t-2 border-primary border-x border-b border-[#E9ECEF] rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="material-symbols-outlined text-primary bg-primary-container/10 p-2 rounded-lg">eco</span>
                <span className="text-headline-md font-bold text-on-surface">{stats.organic}</span>
              </div>
              <p className="font-title-lg text-title-lg mb-1">Organic</p>
              <p className="text-body-md text-on-surface-variant mb-4">Pure and untreated produce</p>
            </div>
            <div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stats.organicPct}%` }}></div>
              </div>
              <p className="text-label-md text-on-surface-variant mt-2">{stats.organicPct}% of total scans</p>
            </div>
          </div>

          {/* Medium Card: Treated */}
          <div className="md:col-span-3 lg:col-span-3 bg-surface border-t-2 border-secondary border-x border-b border-[#E9ECEF] rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="material-symbols-outlined text-secondary bg-secondary-container/10 p-2 rounded-lg">science</span>
                <span className="text-headline-md font-bold text-on-surface">{stats.treated}</span>
              </div>
              <p className="font-title-lg text-title-lg mb-1">Treated</p>
              <p className="text-body-md text-on-surface-variant mb-4">Post-harvest chemical traces</p>
            </div>
            <div>
              <div className="w-full bg-surface-container-highest rounded-full h-2">
                <div className="bg-secondary h-2 rounded-full" style={{ width: `${stats.treatedPct}%` }}></div>
              </div>
              <p className="text-label-md text-on-surface-variant mt-2">{stats.treatedPct}% of total scans</p>
            </div>
          </div>

          {/* Warning Card: High Risk */}
          <div className="md:col-span-3 lg:col-span-3 bg-tertiary-container/5 border border-tertiary-container/30 rounded-xl p-6 shadow-[0px_4px_12px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center">
            <div className="bg-tertiary-container/10 p-4 rounded-full mb-4">
              <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
            <h4 className="text-headline-md font-bold text-tertiary">{stats.highRisk}</h4>
            <p className="font-title-lg text-on-surface font-bold">High Risk Alerts</p>
            <p className="text-body-md text-on-surface-variant mt-1">Hazardous levels detected</p>
            <button onClick={() => navigate('/history')} className="mt-4 text-tertiary font-bold text-label-md hover:underline">VIEW LOGS</button>
          </div>
        </div>
      </section>

      {/* Settings & Actions Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-stack-lg items-start">
        {/* Settings Panel */}
        <div className="bg-surface border border-[#E9ECEF] rounded-xl overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.04)]">
          <div className="p-6 border-b border-outline-variant bg-surface-container-lowest">
            <h3 className="font-title-lg text-title-lg text-on-surface">App Settings</h3>
          </div>
          <div className="divide-y divide-outline-variant">
            {/* Toggle Row */}
            <div className="flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant">notifications_active</span>
                <div>
                  <p className="text-body-lg font-semibold">Notification Preferences</p>
                  <p className="text-body-md text-on-surface-variant">Real-time alerts for high-risk detections</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                <div className="w-4 h-4 bg-on-primary rounded-full absolute right-1"></div>
              </div>
            </div>
            {/* Info Row */}
            <div className="flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant">smart_toy</span>
                <div>
                  <p className="text-body-lg font-semibold">AI Model Version</p>
                  <p className="text-body-md text-on-surface-variant">Enhanced spectral analysis engine</p>
                </div>
              </div>
              <span className="bg-surface-container-highest px-3 py-1 rounded-lg text-label-md font-bold text-on-surface-variant">v2.4.0</span>
            </div>
            {/* Info Row */}
            <div className="flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant">cloud_done</span>
                <div>
                  <p className="text-body-lg font-semibold">Data Storage</p>
                  <p className="text-body-md text-on-surface-variant">Sync state with secure cloud</p>
                </div>
              </div>
              <span className="text-label-md font-bold text-primary">Supabase</span>
            </div>
          </div>
        </div>

        {/* Action Cluster */}
        <div className="space-y-gutter">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-4">download_for_offline</span>
            <h4 className="font-title-lg text-on-surface mb-2">Export Data History</h4>
            <p className="text-body-md text-on-surface-variant mb-6 px-4">Download your entire scan history including chemical breakdown and risk analysis as a formatted spreadsheet.</p>
            <button onClick={handleExport} className="w-full bg-primary text-on-primary py-3 px-6 rounded-xl font-bold transition-transform active:scale-95 shadow-md">Export Data as CSV</button>
          </div>
          <div className="bg-surface border border-[#E9ECEF] rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">logout</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">End Session</p>
                <p className="text-body-md text-on-surface-variant">Log out from this device</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-tertiary font-bold hover:bg-tertiary-container/10 px-4 py-2 rounded-lg transition-colors">Log Out</button>
          </div>
        </div>
      </section>
    </div>
  );
}
