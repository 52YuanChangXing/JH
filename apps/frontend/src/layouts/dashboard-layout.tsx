import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/sidebar';
import { ThemeToggle } from '../components/dashboard/theme-toggle';
import { UserMenu } from '../components/dashboard/user-menu';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { cn } from '../utils/cn';

const breadcrumbsMap: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/projects': '项目管理',
  '/sessions': '拍摄排期',
  '/users': '用户管理',
  '/roles': '角色权限',
  '/audit-logs': '审计日志'
};

export function DashboardLayout() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const breadcrumb = Object.entries(breadcrumbsMap).find(([key]) => pathname.startsWith(key))?.[1] || '仪表盘';

  return (
    <div className="flex min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Sidebar />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="fixed left-4 top-4 z-40 flex items-center gap-2 md:hidden">
            <Menu className="h-5 w-5" />
            菜单
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 md:hidden">
          <Sidebar />
        </DialogContent>
      </Dialog>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">当前页面</p>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{breadcrumb}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className={cn('flex-1 space-y-6 p-4 md:p-8', 'bg-transparent')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
