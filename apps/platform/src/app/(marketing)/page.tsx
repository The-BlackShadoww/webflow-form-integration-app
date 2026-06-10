import Link from "next/link";
import { ArrowRight, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { providers } from "@/features/integrations/providers";
import { LandingTabs } from "./_components/landing-tabs";
import { LandingFaq } from "./_components/landing-faq";
import { LandingPreview } from "./_components/landing-preview";

const tierFeatures = {
  starter: [
    "1 Webflow site",
    "Notion integration",
    "Up to 500 submissions / mo",
    "Delivery log (7 days)",
    "Email support",
  ],
  pro: [
    "Up to 5 Webflow sites",
    "Unlimited integrations",
    "Up to 25,000 submissions / mo",
    "Delivery log (90 days)",
    "Field mapping & filters",
    "Priority email support",
  ],
  max: [
    "Unlimited Webflow sites",
    "Unlimited integrations",
    "Unlimited submissions",
    "Delivery log (1 year)",
    "Webhook retries & alerts",
    "Dedicated support",
  ],
};

export default function LandingPage() {
  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="orb orb-mint left-[-10%] top-[-15%] size-[420px]" />
        <div className="orb orb-peach right-[-10%] top-[10%] size-[380px]" />
        <div className="container relative z-10 py-[var(--spacing-band)] text-center">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.18em] text-mute">
            Made for Webflow
          </p>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.0] tracking-tight text-ink md:text-7xl lg:text-[96px]">
            Form Integration
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-charcoal">
            Send Webflow form submissions to Notion — without writing a line of
            code.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="dark">
              <Link href="#pricing">View pricing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href="https://docs.flowappz.com/home/form-integrations"
                target="_blank"
                rel="noreferrer"
              >
                Docs <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>

          {/* Preview card */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="orb orb-lavender left-1/2 top-1/2 size-[480px] -translate-x-1/2 -translate-y-1/2" />
            <LandingPreview />
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section
        id="pricing"
        className="border-t border-hairline bg-surface-bone py-[var(--spacing-section)]"
      >
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Simple monthly pricing
            </h2>
            <p className="mt-4 text-lg text-charcoal">
              Every tier unlocks the same integrations. Pick the volume that
              matches your traffic.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
            {/* Starter */}
            <div className="flex flex-col rounded-lg border border-hairline bg-surface-card p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                Starter
              </p>
              <p className="mt-4 font-display text-5xl font-bold tracking-tight text-ink">
                $9<span className="text-2xl text-mute">.99</span>
              </p>
              <p className="text-sm text-mute">per month</p>
              <p className="mt-4 text-sm text-charcoal">
                For a single site or light Webflow build.
              </p>
              <ul className="mt-6 space-y-3">
                {tierFeatures.starter.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[15px] text-body">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant="outline">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            {/* Pro (featured / dark inversion) */}
            <div className="relative flex flex-col rounded-lg bg-surface-dark p-8 text-on-dark">
              <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-primary">
                Most popular
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-on-dark-mute">
                Pro
              </p>
              <p className="mt-4 font-display text-5xl font-bold tracking-tight">
                $29<span className="text-2xl opacity-70">.99</span>
              </p>
              <p className="text-sm text-on-dark-mute">per month</p>
              <p className="mt-4 text-sm text-on-dark-mute">
                For active sites — more form volume, more destinations.
              </p>
              <ul className="mt-6 space-y-3">
                {tierFeatures.pro.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[15px]">
                    <Check className="mt-0.5 size-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 w-full bg-surface-card text-ink hover:bg-surface-bone"
              >
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>

            {/* Max */}
            <div className="flex flex-col rounded-lg border border-hairline bg-surface-card p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-mute">
                Max
              </p>
              <p className="mt-4 font-display text-5xl font-bold tracking-tight text-ink">
                $49<span className="text-2xl text-mute">.99</span>
              </p>
              <p className="text-sm text-mute">per month</p>
              <p className="mt-4 text-sm text-charcoal">
                For agencies and high-traffic Webflow sites.
              </p>
              <ul className="mt-6 space-y-3">
                {tierFeatures.max.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[15px] text-body">
                    <Check className="mt-0.5 size-4 shrink-0 text-ink" /> {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full" variant="outline">
                <Link href="/sign-up">Get started</Link>
              </Button>
            </div>
          </div>
          <p className="mt-10 text-center text-sm text-mute">
            Cancel any time. Volume includes all integrations.
          </p>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section id="features" className="border-t border-hairline py-[var(--spacing-section)]">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              Built for how you ship in Webflow
            </h2>
            <p className="mt-4 text-lg text-charcoal">
              Every Webflow form, every destination, in one panel — no scripts,
              no glue code.
            </p>
          </div>
          <LandingTabs providers={providers.filter((p) => p.enabled)} />
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="border-t border-hairline bg-surface-bone py-[var(--spacing-section)]">
        <div className="container max-w-3xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-mute">
            FAQ
          </p>
          <h2 className="mt-2 text-center font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Frequently Asked
          </h2>
          <div className="mt-12">
            <LandingFaq />
          </div>
        </div>
      </section>

      {/* ═══════════ CTA BAND ═══════════ */}
      <section className="relative overflow-hidden border-t border-hairline py-[var(--spacing-band)]">
        <div className="orb orb-sky left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2" />
        <div className="container relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mute">
            Try our Webflow apps
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-ink md:text-6xl">
            Effortless website building
            <br />
            with our premium Webflow apps.
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Get started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="mailto:contact@flowappz.com">
                <Send className="size-4" /> Talk to us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
