"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, setUser, reset } = useAuthStore();

  // Hydrate user when token exists but user not loaded
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await authApi.me()).data.user,
    enabled: !!token && !user,
    retry: false,
  });

  useEffect(() => {
    if (meQ.data) setUser(meQ.data);
  }, [meQ.data, setUser]);

  useEffect(() => {
    if (!token) {
      reset();
      router.replace(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
    } else if (meQ.isError) {
      reset();
      router.replace("/sign-in");
    }
  }, [token, meQ.isError, router, pathname, reset]);

  if (!token || meQ.isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
