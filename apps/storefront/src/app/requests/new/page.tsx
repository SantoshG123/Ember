import type { Metadata } from "next"
import { RequestForm } from "@/components/request-form"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Post a request",
  description: "Describe a local need and invite qualified sellers to respond.",
}

export default function NewRequestPage() {
  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <RequestForm />
    </main>
  )
}
