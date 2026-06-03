import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    organic: 0,
    treated: 0,
    avgConfidence: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        let currentSession = null;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          currentSession = session;
        } catch (e) {
          console.warn("Could not get Supabase session, checking local session...");
        }

        // Check if there is a local session saved
        if (!currentSession) {
          const localSessionStr = localStorage.getItem('fs_local_session');
          if (localSessionStr) {
            currentSession = JSON.parse(localSessionStr);
          }
        }

        if (!currentSession) return;

        let predictionsData = [];
        const isLocalUser = currentSession.user?.id === 'local-user-id';

        if (isLocalUser) {
          // Immediately load from localStorage in demo mode
          const localData = localStorage.getItem('fs_local_predictions');
          predictionsData = localData ? JSON.parse(localData) : [];
        } else {
          try {
            const { data, error } = await supabase
              .from('predictions')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .order('created_at', { ascending: false });

            if (error) throw error;
            predictionsData = data || [];
          } catch (err) {
            console.warn("Failed to fetch predictions from Supabase. Falling back to local storage:", err);
            const localData = localStorage.getItem('fs_local_predictions');
            predictionsData = localData ? JSON.parse(localData) : [];
          }
        }

        // Calculate stats
        const total = predictionsData.length;
        let organic = 0;
        let treated = 0;
        let totalConfidence = 0;

        predictionsData.forEach(item => {
          if (item.category === 'Organic / Naturally Grown' || item.category === 'Organic') organic++;
          else treated++;
          
          const conf = parseFloat(item.confidence);
          if (!isNaN(conf)) {
            totalConfidence += conf <= 1 ? conf * 100 : conf;
          }
        });

        const avgConfidence = total > 0 ? Math.round(totalConfidence / total) : 0;

        setStats({
          total,
          organic,
          treated,
          avgConfidence
        });

        setRecentScans(predictionsData.slice(0, 4)); // Top 4 recent
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Format date helper
  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.abs(now - date) / 36e5;
    if (diffHours < 24) {
      if (diffHours < 1) return 'Just now';
      return `${Math.floor(diffHours)}h ago`;
    }
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCategoryStyle = (category) => {
    if (category?.includes('Organic')) {
      return { borderClass: 'border-primary', bgClass: 'bg-primary/10 text-primary', label: 'Organic' };
    }
    if (category?.includes('Possibly')) {
      return { borderClass: 'border-secondary-container', bgClass: 'bg-secondary-container/10 text-secondary-container', label: 'Possibly Treated' };
    }
    return { borderClass: 'border-tertiary', bgClass: 'bg-tertiary-container/10 text-tertiary', label: 'High Risk' };
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in">
      {/* Left Column: Hero & Stats */}
      <div className="xl:col-span-7 flex flex-col gap-8">
        {/* Hero Section */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-primary-container p-8 lg:p-10 text-on-primary-container shadow-sm border border-[#E9ECEF]">
            <div className="relative z-10 lg:max-w-md">
              <h1 className="font-headline-lg text-[32px] lg:text-[40px] leading-tight mb-4">Know what's on your plate</h1>
              <p className="font-body-lg text-body-lg opacity-90 mb-8">Instantly detect pesticides and organic quality with AI-driven visual analysis.</p>
              <button onClick={() => navigate('/upload')} className="bg-primary text-on-primary font-title-lg text-title-lg px-8 py-4 rounded-xl flex items-center justify-center gap-3 w-full lg:w-fit shadow-lg active:scale-95 transition-all hover:bg-primary/90">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>barcode_scanner</span>
                Scan a Fruit or Vegetable
              </button>
            </div>
            {/* Abstract decorative element */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* Dashboard Summary Grid */}
        <section>
          <h2 className="font-title-lg text-title-lg mb-6 flex items-center justify-between">
            Dashboard Summary
            <span className="font-label-md text-label-md text-primary font-semibold">Updated Today</span>
          </h2>
          {loading ? (
             <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-gutter">
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-[#E9ECEF] flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant">Total Scans</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-on-background">{stats.total}</span>
                </div>
              </div>
              
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-[#E9ECEF] flex flex-col gap-2 border-t-4 border-primary">
                <span className="font-label-md text-label-md text-on-surface-variant">Organic Items</span>
                <span className="text-3xl font-extrabold text-primary">{stats.organic}</span>
              </div>
              
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-[#E9ECEF] flex flex-col gap-2 border-t-4 border-secondary-container">
                <span className="font-label-md text-label-md text-on-surface-variant">Treated Items</span>
                <span className="text-3xl font-extrabold text-secondary">{stats.treated}</span>
              </div>
              
              <div className="bg-surface-container-lowest p-6 rounded-xl border border-[#E9ECEF] flex flex-col gap-2">
                <span className="font-label-md text-label-md text-on-surface-variant">Avg. Confidence</span>
                <span className="text-3xl font-extrabold text-on-background">{stats.avgConfidence}%</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Right Column: Recent Scans */}
      <div className="xl:col-span-5">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-title-lg text-title-lg">Recent Scans</h2>
            <Link to="/history" className="text-primary font-label-md text-label-md uppercase tracking-wider font-bold hover:underline">View History</Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8"><span className="material-symbols-outlined animate-spin text-primary text-3xl">sync</span></div>
            ) : recentScans.length === 0 ? (
              <div className="bg-surface-container-lowest p-8 rounded-xl border border-[#E9ECEF] text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">history</span>
                <p>No recent scans found.</p>
              </div>
            ) : (
              recentScans.map((scan) => {
                const style = getCategoryStyle(scan.category);
                const conf = parseFloat(scan.confidence);
                const confPct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
                
                return (
                  <div key={scan.id} onClick={() => navigate('/report', { state: { result: scan, image: scan.image_url } })} className={`bg-surface-container-lowest p-4 rounded-xl border border-[#E9ECEF] border-l-4 ${style.borderClass} shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant flex items-center justify-center">
                      {scan.image_url ? (
                        <img className="w-full h-full object-cover" src={scan.image_url} alt="Scan preview" />
                      ) : (
                        <span className="material-symbols-outlined text-outline">image</span>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h3 className="font-title-lg text-title-lg truncate pr-2">Scanned Item</h3>
                        <span className="font-label-md text-[11px] text-on-surface-variant whitespace-nowrap">{timeAgo(scan.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`${style.bgClass} px-3 py-1 rounded-full font-label-md text-[11px] font-bold`}>{style.label}</span>
                        <span className="text-on-surface-variant font-label-md text-[12px] flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">verified</span> {confPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
