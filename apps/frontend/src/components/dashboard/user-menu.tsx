import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItemWrapper,
  DropdownMenuContentWrapper,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';

export function UserMenu() {
  const { user, logout } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <span className="flex flex-col items-start text-left">
            <span className="text-sm font-semibold">{user?.displayName}</span>
            <span className="text-xs text-slate-500">{user?.roles.join(' / ')}</span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContentWrapper align="end">
        <DropdownMenuLabel>账户</DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 h-px bg-slate-200" />
        <DropdownMenuItemWrapper onSelect={() => logout()} className="gap-2 text-red-600 focus:text-red-600">
          <LogOut className="h-4 w-4" /> 退出登录
        </DropdownMenuItemWrapper>
      </DropdownMenuContentWrapper>
    </DropdownMenu>
  );
}
