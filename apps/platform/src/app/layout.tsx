import "@/app/globals.css";

export const metadata = {
  title: "Notion Form Integration",
  description: "Connect your forms to Notion databases.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
