import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }: DialogPrimitive.DialogOverlayProps) {
  return <DialogPrimitive.Overlay className={cn('fixed inset-0 z-50 bg-black/40 backdrop-blur-sm', className)} {...props} />;
}

export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-lg focus:outline-none dark:border-slate-800 dark:bg-slate-900',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-slate-500">
            <X className="h-4 w-4" />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);

export const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
);

export const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-slate-500', className)} {...props} />
);
