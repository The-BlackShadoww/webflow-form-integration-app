"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Provider } from "@/features/integrations/providers";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

type Props = { providers: Provider[] };

const panels = [
  {
    id: "crm",
    label: "CRM",
    title: "Send leads to your CRM",
    body: "OAuth into HubSpot or push contacts to Constant Contact. Field mapping is visual — pick which form field maps to which CRM property.",
    match: ["HUBSPOT", "CONSTANTCONTACT"],
  },
  {
    id: "marketing",
    label: "Email & Marketing",
    title: "Grow your audience",
    body: "Subscribe form submitters to Mailchimp, Klaviyo, Brevo, MailerLite, Sender and more. Tag them on the way in.",
    match: ["MAILCHIMP", "KLAVIYO", "BREVO", "MAILERLITE", "EMAILOCTOPUS", "MOONSEND", "OMNISEND", "SENDER", "ACTIVECAMPAIGN", "GETRESPONSE"],
  },
  {
    id: "messaging",
    label: "Messaging",
    title: "Get notified instantly",
    body: "Post to Slack or Discord the moment a form is submitted. Format the message with any field from the form.",
    match: ["SLACK", "DISCORD"],
  },
  {
    id: "data",
    label: "Databases",
    title: "Pipe to Google Sheets, Notion, Airtable",
    body: "Treat your form as a source-of-truth feed. Append rows, create records, or update existing ones via key matching.",
    match: ["GOOGLESHEET", "NOTION", "AIRTABLE"],
  },
  {
    id: "webhook",
    label: "Webhooks",
    title: "Wire anything via webhook",
    body: "Trigger Zapier, Make, or your own endpoint with the raw submission payload. Add custom headers and retry policy.",
    match: ["WEBHOOK", "ZAPIER", "MAKE"],
  },
];

export function LandingTabs({ providers }: Props) {
  return (
    <Tabs defaultValue="crm" className="mx-auto max-w-5xl items-center">
      <div className="mb-8 w-full overflow-x-auto">
        <TabsList className="mx-auto !flex !h-auto !w-fit flex-nowrap items-center gap-2 !bg-transparent !p-0">
          {panels.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className="!rounded-full !border !border-border !bg-card px-5 py-2 text-[14px] data-[state=active]:!bg-foreground data-[state=active]:!text-[var(--card)] data-[state=active]:!border-foreground"
            >
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {panels.map((p) => {
        const list = providers.filter((pr) => p.match.includes(pr.typeEnum));
        return (
          <TabsContent key={p.id} value={p.id} className="mt-0">
            <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{p.label}</p>
              <h3 className="mt-3 font-serif text-3xl font-normal tracking-tight md:text-4xl">{p.title}</h3>
              <p className="mt-4 max-w-xl text-[15px] text-muted-foreground">{p.body}</p>

              <div className="mt-8 flex flex-wrap gap-2">
                {list.map((pr) => (
                  <span key={pr.slug} className="rounded-full border border-border bg-canvas-soft px-3 py-1.5 text-sm text-foreground">
                    {pr.name}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <Button asChild size="sm">
                  <Link href="/sign-up">Install the app <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
