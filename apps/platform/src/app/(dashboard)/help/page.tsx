"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Mail, PlayCircle } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

const SUPPORT_EMAIL = "contact@flowappz.com";

export default function HelpPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["help-tutorials"],
    queryFn: async () => (await dashboardApi.helpTutorials()).data.tutorials,
    refetchOnMount: false,
    staleTime: 60 * 60 * 1000,
  });
  const tutorials = data ?? [];

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground text-sm">
          Setup tutorials and contact info for the Form Integration app.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 flex items-start gap-3">
          <Mail className="size-5 text-muted-foreground mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-0.5">Direct support</p>
            <p className="text-muted-foreground">
              Stuck or want a new feature? Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a> — we usually reply within a day.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <PlayCircle className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">Video tutorials</p>
          </div>

          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600">Failed to load tutorials. Reload the page.</p>
          ) : tutorials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tutorials available yet.</p>
          ) : (
            <ul className="divide-y">
              {tutorials.map((t) => (
                <li key={t.url}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="truncate">{t.name}</span>
                    <ExternalLink className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
