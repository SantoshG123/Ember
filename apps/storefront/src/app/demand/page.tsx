import type { Metadata } from "next"
import { DemandMap } from "@/components/demand-map"

export const metadata: Metadata = {
  title: "Austin demand map | EMBER",
  description: "Explore privacy-safe clusters of active local demand across Austin.",
}

export default function DemandPage() {
  return <DemandMap />
}
