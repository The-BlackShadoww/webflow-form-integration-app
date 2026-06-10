import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-canvas p-6">
      <div className="orb orb-mint left-[-15%] top-[-10%] size-[420px]" />
      <div className="orb orb-lavender right-[-15%] bottom-[-10%] size-[420px]" />

      <Link
        href="/"
        className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-mute transition hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Back to home
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-2 text-ink">
            <Logo className="size-7" />
            <span className="font-display text-xl font-bold tracking-tight">Form Integration</span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
            Webflow form integrations
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
