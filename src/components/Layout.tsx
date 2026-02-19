import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, Users, Search, TrendingUp } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Rol', icon: Search },
  { to: '/ranking', label: 'Ranking', icon: Users },
  { to: '/insights', label: 'Insights', icon: TrendingUp },
];

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">Skills Intelligence</h1>
              <p className="text-xs text-muted-foreground">Banco Sabadell · Selección</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
