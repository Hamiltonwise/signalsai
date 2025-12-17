import type { PropsWithChildren, ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export interface AdminLayoutProps extends PropsWithChildren {
  actionBar?: ReactNode;
}

export function AdminLayout({ children, actionBar }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-alloro-bg font-body text-alloro-navy">
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Content Area - shifted right to accommodate fixed sidebar */}
      <div className="flex flex-1 flex-col ml-72 w-[calc(100%-18rem)]">
        <AdminTopBar />
        <div className="flex flex-1 flex-col gap-6 px-8 py-8 max-w-[1400px] mx-auto w-full">
          {actionBar ? (
            <div className="flex items-center justify-between">{actionBar}</div>
          ) : null}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
