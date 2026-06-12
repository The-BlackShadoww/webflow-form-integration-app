"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AuthNav() {
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by returning a skeleton/empty state of roughly the same width
  if (!mounted) {
    return <div className="h-8 w-[150px] opacity-0" />;
  }

  if (token) {
    return (
      <Button asChild size="sm">
        <Link href="/sites">
          Dashboard <ArrowRight className="ml-1 size-4" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Get started</Link>
      </Button>
    </div>
  );
}
