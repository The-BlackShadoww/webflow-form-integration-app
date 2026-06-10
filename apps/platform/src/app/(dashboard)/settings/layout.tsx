"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/settings", label: "Profile" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/appearance", label: "Appearance" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account.</p>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="lg:w-48">
          <nav className="flex flex-col gap-0.5 text-sm">
            {items.map((i) => {
              const active = pathname === i.href;
              return (
                <Link key={i.href} href={i.href} className={cn(
                  "rounded-md px-2 py-1.5 transition",
                  active ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}>
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
