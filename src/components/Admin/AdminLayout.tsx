import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { LoadingIndicator } from "./LoadingIndicator";

export interface AdminLayoutProps extends PropsWithChildren {}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 font-body text-gray-900">
      {/* Page transition loading indicator */}
      <LoadingIndicator />

      {/* Full-width sticky header */}
      <AdminTopBar />

      {/* Content area below header */}
      <div className="flex">
        {/* Sticky sidebar below header */}
        <AdminSidebar />

        {/* Main content - shifted right to accommodate sidebar */}
        <main className="flex-1 ml-72 p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1400px] mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
