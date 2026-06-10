import { CheckCircle2, Globe, Plug, ScrollText } from "lucide-react";

export function LandingPreview() {
  return (
    <div className="relative z-10 mx-auto overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_24px_60px_rgba(0,0,0,0.06)]">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-[var(--gradient-rose)]" />
        <span className="size-2.5 rounded-full bg-[var(--gradient-peach)]" />
        <span className="size-2.5 rounded-full bg-[var(--gradient-mint)]" />
        <p className="ml-3 text-xs text-muted-foreground">app.flowappz.com / sites</p>
      </div>

      <div className="grid grid-cols-12">
        {/* Sidebar */}
        <aside className="col-span-3 border-r border-border p-4 hidden md:block">
          <p className="font-serif text-base font-light leading-tight">Form Integration</p>
          <nav className="mt-4 space-y-1 text-[13px]">
            {[
              { icon: Globe, label: "Sites", active: true },
              { icon: Plug, label: "Integrations" },
              { icon: ScrollText, label: "Logs" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded-full px-2 py-1.5 ${
                  active ? "bg-surface-strong text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" /> {label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main panel */}
        <div className="col-span-12 md:col-span-9 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-serif text-2xl font-light tracking-tight">Connected sites</p>
              <p className="text-xs text-muted-foreground">2 sites · 5 integrations active</p>
            </div>
            <span className="rounded-full bg-foreground px-3 py-1 text-xs text-[var(--card)]">+ Add site</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              { name: "acme.webflow.io", int: ["HubSpot", "Slack", "Google Sheets"] },
              { name: "studio.webflow.io", int: ["Notion", "Mailchimp"] },
            ].map((site) => (
              <div key={site.name} className="rounded-xl border border-border bg-canvas-soft p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{site.name}</p>
                  <CheckCircle2 className="size-4 text-[var(--success)]" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {site.int.map((i) => (
                    <span key={i} className="rounded-full bg-surface-strong px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Recent deliveries</p>
            <ul className="mt-3 divide-y divide-border text-[13px]">
              {[
                { form: "contact-us", dest: "HubSpot", status: "200" },
                { form: "newsletter", dest: "Mailchimp", status: "200" },
                { form: "demo-request", dest: "Slack", status: "200" },
              ].map((d) => (
                <li key={d.form + d.dest} className="flex items-center justify-between py-2">
                  <span className="text-foreground">{d.form}</span>
                  <span className="text-muted-foreground">→ {d.dest}</span>
                  <span className="font-mono text-xs text-[var(--success)]">{d.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
