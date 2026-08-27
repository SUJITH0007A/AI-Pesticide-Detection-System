import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: 'home' },
  { path: '/upload', label: 'Scan', icon: 'barcode_scanner' },
  { path: '/history', label: 'History', icon: 'history' },
  { path: '/profile', label: 'Profile', icon: 'person' },
];

export default function Layout({ session }) {
  const location = useLocation();

  const userEmail = session?.user?.email || 'User';
  const userName = userEmail.split('@')[0];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out notice:", e);
    } finally {
      localStorage.removeItem('fs_local_session');
      window.location.href = '/login';
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen">
      {/* Desktop Sidebar / Mobile TopBar */}
      <header className="fixed top-0 left-0 h-14 lg:h-screen w-full lg:w-72 bg-surface dark:bg-on-background border-b lg:border-b-0 lg:border-r border-outline-variant dark:border-outline shadow-sm z-50 flex lg:flex-col items-center justify-between px-container-margin lg:px-6 lg:py-8">
        <div className="flex lg:flex-col items-center lg:items-start gap-2 lg:gap-8 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[20px] lg:text-[24px]">biotech</span>
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed">FreshScan</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-col w-full gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary-container/10'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-title-lg text-title-lg">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* TopBar Actions (Mobile) / Bottom Actions (Desktop) */}
        <div className="flex lg:flex-col items-center gap-4 lg:w-full">
          <button className="material-symbols-outlined text-on-surface-variant dark:text-outline-variant hover:bg-surface-container-low dark:hover:bg-inverse-surface p-2 rounded-full transition-colors duration-200 lg:w-full lg:flex lg:items-center lg:gap-4 lg:px-4">
            <span className="material-symbols-outlined">notifications</span>
            <span className="hidden lg:inline font-body-lg">Notifications</span>
          </button>
          <div className="flex items-center gap-3 lg:w-full lg:px-2 lg:mt-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-outline-variant bg-primary-container text-on-primary flex items-center justify-center font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-title-lg text-[14px] truncate">{userName}</span>
                {session?.user?.id === 'local-user-id' && (
                  <span className="text-[10px] bg-secondary-container/20 text-secondary border border-secondary-container/30 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">Demo</span>
                )}
              </div>
              <span className="text-on-surface-variant text-[12px] truncate">{userEmail}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error hover:bg-error-container/10 p-2 rounded-xl transition-colors duration-200 lg:w-full lg:flex lg:items-center lg:gap-4 lg:px-4 text-left"
            title="Log Out"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="hidden lg:inline font-body-lg font-semibold">Log Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 lg:pt-8 lg:ml-72 px-container-margin lg:px-12 max-w-[1400px] mx-auto pb-24 lg:pb-12 min-h-screen flex flex-col">
        <Outlet />
      </main>

      {/* BottomNavBar (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 py-2 pb-safe bg-surface dark:bg-on-background border-t border-outline-variant dark:border-outline shadow-[0px_-4px_12px_rgba(0,0,0,0.04)] rounded-t-xl">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center active:scale-95 transition-transform ${
                isActive
                  ? 'text-primary bg-primary-container/10 rounded-full px-4 py-1'
                  : 'text-on-surface-variant hover:bg-surface-container-highest/50 p-2'
              }`}
            >
              <span className="material-symbols-outlined font-label-md text-label-md">{item.icon}</span>
              <span className={`font-label-md text-[10px] ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
