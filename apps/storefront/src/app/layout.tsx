import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { DataModeNotice } from "@/components/data-mode-notice"

export const metadata: Metadata = {
  title: {
    default: "EMBER — Where demand sparks opportunity.",
    template: "%s — EMBER",
  },
  description:
    "Publish what you need and let trusted local sellers respond to visible demand.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers><DataModeNotice />{children}</Providers>
      </body>
    </html>
  )
}
