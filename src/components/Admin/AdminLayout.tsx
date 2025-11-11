import type { PropsWithChildren, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export interface AdminLayoutProps extends PropsWithChildren {
  actionBar?: ReactNode;
}

export function AdminLayout({ children, actionBar }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminTopBar />
        <div className="flex flex-1 flex-col gap-4 px-6 py-6">
          {actionBar ? (
            <div className="flex items-center justify-between">{actionBar}</div>
          ) : null}
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
