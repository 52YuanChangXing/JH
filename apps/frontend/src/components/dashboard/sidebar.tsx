import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Gauge,
  Camera,
  CalendarClock,
  CalendarCheck,
  Users,
  ShieldCheck,
  FileText,
  Images,
  Palette,
  UserRound
} from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { cn } from '../../utils/cn';

const NAV_ITEMS = [
  { label: '仪表盘', icon: Gauge, to: '/admin/dashboard', permission: 'dashboard:view' },
  { label: '项目管理', icon: Camera, to: '/admin/projects', permission: 'projects:read' },
  { label: '拍摄排期', icon: CalendarClock, to: '/admin/sessions', permission: 'sessions:read' },
  { label: '客户预约', icon: CalendarCheck, to: '/admin/bookings', permission: 'bookings:read' },
  { label: '摄影师管理', icon: UserRound, to: '/admin/photographers', permission: 'photographers:read' },
  { label: '服务套餐', icon: Palette, to: '/admin/services', permission: 'services:read' },
  { label: '作品集管理', icon: Images, to: '/admin/portfolio', permission: 'portfolio:read' },
  { label: '内容配置', icon: FileText, to: '/admin/content', permission: 'content:manage' },
  { label: '用户管理', icon: Users, to: '/admin/users', permission: 'users:manage' },
  { label: '角色权限', icon: ShieldCheck, to: '/admin/roles', permission: 'roles:manage' },
  { label: '审计日志', icon: FileText, to: '/admin/audit-logs', permission: 'audit:view' }
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const { hasPermission } = useAuth();

  const items = useMemo(() => NAV_ITEMS.filter((item) => hasPermission(item.permission)), [hasPermission]);

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-950/80 md:flex">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xl font-semibold text-brand-600">
          <span>简浩影视</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">专业摄影服务的数字化后台</p>
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-600',
              pathname.startsWith(item.to) && 'bg-brand-100 text-brand-700'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
