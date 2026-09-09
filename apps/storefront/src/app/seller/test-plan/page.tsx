import type { Metadata } from "next"
import { SellerWorkspace } from "@/components/seller-workspace"

export const metadata: Metadata = { title: "Demand test plan | EMBER" }

export default function SellerTestPlanPage() {
  return <SellerWorkspace view="test-plan" />
}
