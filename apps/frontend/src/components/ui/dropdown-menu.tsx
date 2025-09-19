import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../utils/cn';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;
export const DropdownMenuContent = DropdownMenuPrimitive.Content;
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;

export function DropdownMenuContentWrapper({ className, ...props }: DropdownMenuPrimitive.DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-slate-100 bg-white p-1 text-slate-700 shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
          className
        )}
        sideOffset={8}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItemWrapper({ className, ...props }: DropdownMenuPrimitive.DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none focus:bg-slate-100 focus:text-slate-900 dark:focus:bg-slate-800 dark:focus:text-slate-100',
        className
      )}
      {...props}
    />
  );
}
