import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, Search, LogOut, User, Trophy, BookOpen, Brain, MessageSquare, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AIAssistant from './AIAssistant';

const navItems = [
  { to: '/', label: 'Asistente', icon: MessageSquare },
  { to: '/roles', label: 'Roles', icon: Search },
  { to: '/ranking', label: 'Ranking', icon: Users },
  { to: '/shortlist', label: 'Shortlist', icon: Trophy },
  { to: '/taxonomia', label: 'Taxonomía', icon: BookOpen },
  { to: '/skills-intelligence', label: 'Intelligence', icon: Brain },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isChatPage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-navy shadow-card-lg">
        <div className="flex h-12 sm:h-14 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <img
              src="/sabadell-logo.png"
              alt="Banco Sabadell"
              className="h-4 sm:h-5 w-auto brightness-0 invert shrink-0"
            />
            <div className="h-4 sm:h-5 w-px bg-white/20 shrink-0 hidden sm:block" />
            <div className="hidden sm:block">
              <h1 className="text-xs font-semibold text-white leading-tight tracking-wide">
                Skills Intelligence
              </h1>
              <p className="text-[9px] text-white/50 font-medium tracking-wider uppercase">
                Módulo de Selección
              </p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-white/15 text-white border-b-2 border-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2.5 bg-white/8 px-2.5 py-1 border border-white/10">
              <div className="flex h-6 w-6 items-center justify-center bg-white/10">
                <User className="h-3 w-3 text-white/80" />
              </div>
              <div className="text-right">
                <p className="text-[11px] font-medium text-white/90 leading-tight">{user?.name}</p>
                <p className="text-[9px] text-white/40 leading-tight">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="hidden sm:flex h-7 w-7 items-center justify-center text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-8 w-8 items-center justify-center text-white/70 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-navy pb-2">
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white border-l-2 border-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between px-4 pt-3 mt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center bg-white/10">
                  <User className="h-3 w-3 text-white/80" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-white/90">{user?.name}</p>
                  <p className="text-[9px] text-white/40">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
        <main className="w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1">
          <Outlet />
        </main>
      )}

      {!isChatPage && <AIAssistant />}
    </div>
  );
};

export default Layout;
