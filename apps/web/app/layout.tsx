import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChainProvider } from "@/lib/chain-provider";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "FIELDRAIL — Purpose in every payment",
  description:
    "Purpose-bound stablecoin disbursement and agentic procurement for field programmes on QDay Aevum.",
  icons: { icon: "/brand/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChainProvider>
          <Shell>{children}</Shell>
        </ChainProvider>
      </body>
    </html>
  );
}
