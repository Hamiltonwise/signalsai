import React from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Sidebar({ children, className, ...props }: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarHeader({ children, className, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-2 p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarContent({ children, className, ...props }: SidebarContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-auto p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarFooter({ children, className, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn("p-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarMenu({ children, className, ...props }: SidebarMenuProps) {
  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarMenuItem({ children, className, ...props }: SidebarMenuItemProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isActive?: boolean;
}

export function SidebarMenuButton({ 
  children, 
  className, 
  isActive = false,
  ...props 
}: SidebarMenuButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarGroup({ children, className, ...props }: SidebarGroupProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarGroupContent({ children, className, ...props }: SidebarGroupContentProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SidebarProvider({ children, className, ...props }: SidebarProviderProps) {
  return (
    <div
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SidebarTrigger({ children, className, ...props }: SidebarTriggerProps) {
  return (
    <button
      className={cn("", className)}
      {...props}
    >
      {children}
    </button>
  );
}