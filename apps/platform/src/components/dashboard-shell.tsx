"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, HelpCircle, Plug, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/logo";

const baseNav = [
  { href: "/sites", label: "Sites", icon: Globe },
  { href: "/help", label: "Help", icon: HelpCircle },
];

const SITE_PATH = /^\/sites\/([^/]+)(?:\/|$)/;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const siteMatch = pathname.match(SITE_PATH);
  const siteId = siteMatch?.[1];
  const navItems = siteId
    ? [
        baseNav[0],
        { href: `/sites/${siteId}/integrations`, label: "Integrations", icon: Plug },
        { href: `/sites/${siteId}/logs`, label: "Logs", icon: ScrollText },
        baseNav[1],
      ]
    : baseNav;
  return (
    <div className="flex min-h-svh bg-canvas">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col gap-2 border-r border-hairline bg-surface-card p-5">
        <div className="flex items-center gap-3 px-2 py-3">
          <Logo className="size-7 text-ink" />
          <p className="font-display text-xl font-bold leading-tight tracking-tight text-ink">
            Form Integration
          </p>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5 text-sm">
          {navItems.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-3 py-2 transition",
                  active
                    ? "bg-surface-bone font-semibold text-ink"
                    : "text-charcoal hover:bg-surface-bone hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-[60px] items-center gap-3 border-b border-hairline bg-surface-card/80 px-6 backdrop-blur">
          <div className="ms-auto flex items-center gap-2">
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </header>
        <main className="flex-1 p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
