import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ThemeToggle } from '../components/dashboard/theme-toggle';

const NAV_ITEMS = [
  { label: '作品集', to: '/portfolio' },
  { label: '摄影师', to: '/photographers' },
  { label: '服务项目', to: '/services' },
  { label: '立即预约', to: '/booking' }
];

export function PublicLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="rounded-full bg-slate-900 px-2 py-1 text-sm uppercase tracking-wide text-white">JH</span>
            <span>简浩影视 JIANHAO STUDIO</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-slate-900 ${isActive ? 'text-slate-900' : 'text-slate-500'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/admin/login" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
              后台登录
            </Link>
            <ThemeToggle />
          </nav>
          <Button variant="ghost" className="md:hidden" onClick={() => setOpen((prev) => !prev)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {open && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <nav className="flex flex-col px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/admin/login"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-slate-900 text-white' : 'text-slate-600'}`
                }
              >
                后台登录
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">简浩影视 · Jianhao Studio</p>
            <p className="text-xs text-slate-500">以电影级影像语言为品牌与爱情故事打造难忘瞬间。</p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Jianhao Studio</span>
            <Link to="/booking" className="hover:text-slate-900">
              联系我们
            </Link>
            <Link to="/privacy" className="hover:text-slate-900">
              隐私政策
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
