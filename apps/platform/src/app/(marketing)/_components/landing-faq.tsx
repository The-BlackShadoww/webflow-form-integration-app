"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  {
    q: "How does Form Integration connect to my Webflow forms?",
    a: "After installing the app, we subscribe to Webflow's form_submission webhook. Every submission on your published site is forwarded to us, then dispatched to your configured destinations.",
  },
  {
    q: "Do I need to change my Webflow forms?",
    a: "No. Your existing Webflow forms keep working exactly as before. We listen to submissions in the background — no markup or script changes required.",
  },
  {
    q: "What happens if a destination fails?",
    a: "Failed deliveries are logged with the response body and retried automatically on the Pro and Max plans. You can also re-run any delivery manually from the Logs page.",
  },
  {
    q: "How can I contact you?",
    a: "Email contact@flowappz.com or use the contact form on this site. We usually reply within a day.",
  },
  {
    q: "Is it refundable?",
    a: "Yes. If the app doesn't fit your workflow, email us within 14 days of purchase for a full refund — no questions asked.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <li key={item.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
            >
              <span className="font-serif text-lg font-normal text-foreground">
                {i + 1}. {item.q}
              </span>
              {isOpen ? <Minus className="size-4 shrink-0 text-muted-foreground" /> : <Plus className="size-4 shrink-0 text-muted-foreground" />}
            </button>
            <div className={cn("overflow-hidden px-6 transition-all", isOpen ? "max-h-60 pb-5" : "max-h-0")}>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
