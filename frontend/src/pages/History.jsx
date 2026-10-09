import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All Scans');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchHistory() {
      try {
        let currentSession = null;
        const localSessionStr = localStorage.getItem('fs_local_session');
        if (localSessionStr) {
          try { currentSession = JSON.parse(localSessionStr); } catch (e) {}
        }

        if (!currentSession) {
          try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 1000));
            const res = await Promise.race([sessionPromise, timeoutPromise]);
            currentSession = res?.data?.session || null;
          } catch (e) {
            console.warn("Supabase session fetch timed out:", e);
          }
        }

        if (!currentSession) {
          currentSession = { user: { id: 'local-user-id', email: 'demo@freshscan.ai' } };
        }

        // Always retrieve local storage predictions
        const localData = localStorage.getItem('fs_local_predictions');
        const localPredictions = localData ? JSON.parse(localData) : [];

        let cloudPredictions = [];
        if (currentSession.user?.id && currentSession.user.id !== 'local-user-id' && currentSession.user.id.length === 36) {
          try {
            const queryPromise = supabase
              .from('predictions')
              .select('*')
              .eq('user_id', currentSession.user.id)
              .order('created_at', { ascending: false });

            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: null, error: new Error("Supabase history query timeout") }), 1200));
            const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

            if (!error && data) cloudPredictions = data;
          } catch (err) {
            console.warn("Cloud history fetch notice:", err);
          }
        }

        // Combine local and cloud predictions, avoiding duplicates
        const combined = [...localPredictions];
        cloudPredictions.forEach(cloudItem => {
          if (!combined.some(localItem => localItem.created_at === cloudItem.created_at)) {
            combined.push(cloudItem);
          }
        });

        // Sort by date descending
        combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const predictionsData = combined;

        if (isMounted) setHistory(predictionsData);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  const getStyle = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('organic')) {
      return { borderClass: 'border-primary', bgClass: 'bg-primary/10 text-primary', label: 'Organic', colorClass: 'text-primary', barBg: 'bg-primary' };
    }
    if (cat.includes('possibly')) {
      return { borderClass: 'border-secondary-container', bgClass: 'bg-secondary-container/10 text-secondary-container', label: 'Possibly Treated', colorClass: 'text-secondary-container', barBg: 'bg-secondary-container' };
    }
    return { borderClass: 'border-tertiary', bgClass: 'bg-tertiary/10 text-tertiary', label: 'High Risk', colorClass: 'text-tertiary', barBg: 'bg-tertiary' };
  };

  const filteredHistory = history.filter(item => {
    let matchesFilter = true;
    if (filter === 'Organic') matchesFilter = item.category?.toLowerCase().includes('organic');
    if (filter === 'Possibly Treated') matchesFilter = item.category?.toLowerCase().includes('possibly');
    if (filter === 'High Risk') matchesFilter = !item.category?.toLowerCase().includes('organic') && !item.category?.toLowerCase().includes('possibly');
    
    // Default search matches name
    // Since we don't store "name" in db, just match category for now
    let matchesSearch = true;
    if (search) {
      matchesSearch = item.category?.toLowerCase().includes(search.toLowerCase());
    }

    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in w-full">
      {/* Search & Filter Section */}
      <section className="mt-stack-lg">
        <div className="relative flex items-center mb-stack-md max-w-2xl">
          <span className="material-symbols-outlined absolute left-3 text-outline">search</span>
          <input 
            className="w-full bg-surface-container-lowest border-outline-variant border rounded-xl py-3 pl-10 pr-4 font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-all" 
            placeholder="Search scans (by category)..." 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-base overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {['All Scans', 'Organic', 'Possibly Treated', 'High Risk'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-md text-label-md active:scale-95 transition-transform ${
                filter === f 
                  ? 'bg-primary text-on-primary' 
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Desktop Optimized Scan History Section */}
      <section className="mt-stack-lg">
        <h2 className="font-title-lg text-title-lg text-on-surface-variant mb-stack-md flex items-center justify-between">
          Recent Insights
          {loading && <span className="material-symbols-outlined animate-spin text-primary">sync</span>}
        </h2>
        
        {!loading && filteredHistory.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 opacity-50">history</span>
            <p>No scans found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Table Container (Visible on Desktop) */}
            <div className="hidden md:block overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 font-label-md text-label-md text-outline uppercase tracking-wider">Produce</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-outline uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-outline uppercase tracking-wider">Result</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-outline uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-4 font-label-md text-label-md text-outline uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {filteredHistory.map(item => {
                    const style = getStyle(item.category);
                    const conf = parseFloat(item.confidence);
                    const confPct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
                    
                    return (
                      <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-base">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-variant flex items-center justify-center shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt="Scan" className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-outline">image</span>
                              )}
                            </div>
                            <span className="font-title-lg text-title-lg truncate max-w-[120px]" title={item.category}>Scanned Item</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-body-md text-on-surface-variant">{formatDate(item.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${style.bgClass} font-label-md text-label-md`}>{style.label}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-surface-container-high rounded-full h-1.5 max-w-[100px] mb-1 overflow-hidden">
                            <div className={`${style.barBg} h-1.5 rounded-full`} style={{ width: `${confPct}%` }}></div>
                          </div>
                          <span className="font-body-md text-on-surface-variant">{confPct}%</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate('/report', { state: { result: item, image: item.image_url } })}
                            className={`px-4 py-2 ${style.barBg} text-on-primary font-label-md text-label-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity`}
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grid List (Mobile View) */}
            <div className="md:hidden space-y-gutter">
              {filteredHistory.map(item => {
                const style = getStyle(item.category);
                const conf = parseFloat(item.confidence);
                const confPct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);

                return (
                  <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-[0px_4px_12px_rgba(0,0,0,0.04)] hover:border-primary transition-all group">
                    <div className={`h-1 ${style.barBg}`}></div>
                    <div className="p-4 flex gap-gutter">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-variant flex items-center justify-center">
                        {item.image_url ? (
                          <img src={item.image_url} alt="Scan" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-outline">image</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-title-lg text-title-lg">Scanned Item</h3>
                            <span className={`px-2 py-0.5 rounded-full ${style.bgClass} font-label-md text-[10px] whitespace-nowrap ml-2`}>{style.label}</span>
                          </div>
                          <p className="font-body-md text-on-surface-variant mt-1">Confidence: {confPct}%</p>
                          <p className="text-xs text-outline mt-1">{formatDate(item.created_at)}</p>
                        </div>
                        <button 
                          onClick={() => navigate('/report', { state: { result: item, image: item.image_url } })}
                          className={`mt-base w-full py-2 border ${style.borderClass} ${style.colorClass} font-label-md text-label-md rounded-lg hover:${style.barBg} hover:text-on-primary transition-colors`}
                        >
                          View Report
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
