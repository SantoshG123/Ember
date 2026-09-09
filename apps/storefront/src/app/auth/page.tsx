import type { Metadata } from "next"
import { AuthExperience } from "@/components/auth-experience"

export const metadata: Metadata = {
  title: "Sign in or create an account",
  description: "Enter EMBER as a buyer, seller, or both.",
}

export default function AuthPage() {
  return <AuthExperience />
}

