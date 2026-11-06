"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user?.role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/landingpage");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
