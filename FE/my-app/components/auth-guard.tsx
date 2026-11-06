"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getStoredUser } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("admin" | "customer" | string)[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const user = getStoredUser();
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = user?.role || "customer";
      if (!allowedRoles.includes(userRole)) {
        router.replace(userRole === "admin" ? "/dashboard" : "/unauthorized");
        return;
      }
    }

    setChecking(false);
  }, [router, allowedRoles]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <svg className="animate-spin h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["admin"]}>{children}</AuthGuard>;
}

export function CustomerGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["customer"]}>{children}</AuthGuard>;
}
