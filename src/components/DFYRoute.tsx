import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

interface DFYRouteProps {
  children: React.ReactNode;
}

/**
 * DFYRoute - Tier-aware route wrapper
 *
 * Protects DFY-tier routes by:
 * 1. Checking org tier before rendering children
 * 2. Redirecting to /dashboard if tier check fails
 * 3. Showing loading state during tier check
 *
 * Defense in depth: Backend still validates on every API call.
 */
export function DFYRoute({ children }: DFYRouteProps) {
  const [checking, setChecking] = useState(true);
  const [hasDFY, setHasDFY] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkTier = async () => {
      try {
        const res = await fetch("/api/user/website");

        if (res.status === 403) {
          // Not DFY tier - redirect
          toast.error("Website feature requires DFY subscription");
          navigate("/dashboard", { replace: true });
          return;
        }

        if (res.ok) {
          setHasDFY(true);
        } else {
          // Other errors (network, server) - redirect to dashboard
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        console.error("[DFYRoute] Tier check failed:", error);
        navigate("/dashboard", { replace: true });
      } finally {
        setChecking(false);
      }
    };

    checkTier();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  return hasDFY ? <>{children}</> : null;
}
