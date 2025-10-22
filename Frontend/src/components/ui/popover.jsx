import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const Popover = ({ open: controlledOpen, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <div className="relative inline-block" data-open={open}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === PopoverTrigger) {
          return React.cloneElement(child, { onOpenChange: handleOpenChange });
        }
        if (child.type === PopoverContent) {
          return open ? React.cloneElement(child, { onClose: () => handleOpenChange(false) }) : null;
        }
        return null;
      })}
    </div>
  );
};

const PopoverTrigger = React.forwardRef(({ className, onClick, onOpenChange, asChild, children, ...props }, ref) => {
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (onOpenChange) onOpenChange(true);
  };

  if (asChild && children) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ref,
      ...props,
    });
  }

  return (
    <button ref={ref} className={className} onClick={handleClick} {...props} />
  );
});
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverContent = React.forwardRef(({ className, align = 'end', sideOffset = 4, onClose, children, ...props }, ref) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div
      ref={ref}
      className={cn(
        'absolute z-50 w-72 rounded-md border border-border bg-card p-4 text-card-foreground shadow-md',
        align === 'start' && 'left-0',
        align === 'end' && 'right-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  </>
));
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };
