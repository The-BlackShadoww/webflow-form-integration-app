import Link from "next/link";
import { Logo } from "@/components/logo";
import { AuthNav } from "./_components/auth-nav";

/* ── DESIGN.md nav-bar ─────────────────────────────────────────
   bg-canvas, height 60px, single hairline bottom border.
   Left: wordmark. Centre: nav links. Right: Sign in + CTA.
*/
/* ── DESIGN.md footer ──────────────────────────────────────────
   bg-surface-deep, text-on-dark, body-sm, padding 64px 32px.
*/

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-canvas text-ink">
      {/* ── NAV BAR ── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/80 backdrop-blur">
        <div className="container flex h-[60px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <Logo className="size-6" />
            <span className="font-display text-lg font-bold tracking-tight">
              Form Integration
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-charcoal md:flex">
            <Link href="/#features" className="transition hover:text-ink">
              Features
            </Link>
            <Link href="/#pricing" className="transition hover:text-ink">
              Pricing
            </Link>
            <Link href="/#faq" className="transition hover:text-ink">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-surface-deep text-on-dark">
        <div className="container flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Logo className="size-5 text-on-dark" />
            <span className="font-display text-base font-bold tracking-tight">
              Form Integration
            </span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-dark-mute">
            <Link href="/#features" className="transition hover:text-on-dark">
              Features
            </Link>
            <Link href="/#pricing" className="transition hover:text-on-dark">
              Pricing
            </Link>
            <a
              href="https://docs.flowappz.com/home/form-integrations"
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-on-dark"
            >
              Docs
            </a>
            <a
              href="mailto:contact@flowappz.com"
              className="transition hover:text-on-dark"
            >
              contact@flowappz.com
            </a>
          </div>
          <p className="text-xs text-on-dark-mute">
            © {new Date().getFullYear()} Flowappz
          </p>
        </div>
      </footer>
    </div>
  );
}
