"use client";

import { useState } from "react";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SUPPORT_EMAIL = "contact@flowappz.com";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Form Integration — message from ${form.name || form.email}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <section className="relative overflow-hidden py-24">
      <div className="orb orb-rose right-[-15%] top-[10%] size-[420px]" />
      <div className="container relative z-10 grid gap-16 md:grid-cols-2">
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Contact</p>
          <h1 className="font-serif text-5xl font-normal leading-[1.05] tracking-tight md:text-6xl">
            Talk to us.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Questions, feature requests, or stuck on setup — drop a line. We usually reply within a day.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[15px] text-muted-foreground hover:text-foreground">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MessageSquare className="size-5 text-foreground" />
              <div>
                <p className="text-sm font-medium">Docs & tutorials</p>
                <a
                  href="https://docs.flowappz.com/home/form-integrations"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[15px] text-muted-foreground hover:text-foreground"
                >
                  docs.flowappz.com
                </a>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-8">
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="What can we help with?"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Send message <Send className="size-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Opens your email client with the message prefilled.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
