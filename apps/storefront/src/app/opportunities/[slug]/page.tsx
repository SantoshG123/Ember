import type { Metadata } from "next"
import { OpportunityDetail } from "@/components/opportunity-detail"

export const metadata: Metadata = {
  title: "East Austin weekday lunch opportunity",
  description: "Explore verified local demand for weekday office lunch delivery in East Austin.",
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <OpportunityDetail slug={slug} />
}
