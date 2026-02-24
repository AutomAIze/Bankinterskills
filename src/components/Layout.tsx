import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AIAssistant from './AIAssistant';
import { brandConfig } from '@/config/brand';
import { navLabels } from '@/config/labels';

const navItems = [
  { to: '/', label: navLabels.assistant },
  { to: '/talent-dashboard', label: navLabels.talentDashboard },
  { to: '/performance-potential', label: navLabels.performance },
  { to: '/talent-succession', label: navLabels.succession },
  { to: '/objectives-bonus', label: navLabels.objectives },
  { to: '/development-actions', label: navLabels.development },
  { to: '/career-paths', label: navLabels.careerPaths },
  { to: '/taxonomia', label: navLabels.taxonomy },
  { to: '/skills-intelligence', label: navLabels.intelligence },
  { to: '/admin', label: navLabels.admin },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-navy shadow-float backdrop-blur-sm">
        <div className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <img
              src={brandConfig.logoWhitePath}
              alt={brandConfig.logoAlt}
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 object-contain rounded-md"
            />
            <div className="h-4 sm:h-5 w-px bg-white/15 shrink-0 hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-xs font-semibold text-white leading-tight tracking-wide">
                {brandConfig.platformName}
              </h1>
              <p className="text-[9px] text-white/40 font-medium tracking-wider uppercase">
                {brandConfig.moduleName}
              </p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-[11px] font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white/15 text-white shadow-inner-glow'
                      : 'text-white/50 hover:text-white/90 hover:bg-white/8'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2.5 bg-white/8 px-3 py-1.5 border border-white/8">
              <div className="flex h-6 w-6 items-center justify-center bg-white/10">
                <User className="h-3 w-3 text-white/80" />
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-white/90 leading-tight">{user?.name}</p>
                <p className="text-[9px] text-white/35 leading-tight">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="hidden sm:flex h-7 w-7 items-center justify-center text-white/35 hover:bg-white/10 hover:text-white/80 transition-all duration-200"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-8 w-8 items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/8 bg-navy/98 backdrop-blur-sm pb-2">
            <nav className="flex flex-col py-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white border-l-2 border-white'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between px-4 pt-3 mt-1 border-t border-white/8">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center bg-white/10">
                  <User className="h-3 w-3 text-white/80" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/90">{user?.name}</p>
                  <p className="text-[9px] text-white/35">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      {isChatPage ? (
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      ) : (
        <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1 animate-fade-in">
          <Outlet />
        </main>
      )}

      {!isChatPage && <AIAssistant />}
    </div>
  );
};

export default Layout;
