import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Dialog = ({ open, onOpenChange, children }) => {
  return (
    <div data-open={open}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DialogTrigger) {
          return React.cloneElement(child, { onOpenChange });
        }
        if (child.type === DialogContent && open) {
          return child;
        }
        return null;
      })}
    </div>
  );
};

const DialogTrigger = React.forwardRef(({ className, onClick, onOpenChange, asChild, ...props }, ref) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (onOpenChange) onOpenChange(true);
  };

  if (asChild && props.children) {
    return React.cloneElement(props.children, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button ref={ref} className={className} onClick={handleClick} {...props} />
  );
});
DialogTrigger.displayName = 'DialogTrigger';

const DialogContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => (
  <>
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
    <div
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  </>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
