import { NextResponse } from "next/server"
import { checkoutAuthorizationSchema } from "@/lib/checkout-schema"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = checkoutAuthorizationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Check the billing information and try again." },
      { status: 400 },
    )
  }

  if (parsed.data.cardLast4 === "0002") {
    return NextResponse.json(
      {
        message:
          "This test authorization was declined. Use a test card ending in 4242 and try again.",
      },
      { status: 402 },
    )
  }

  // Non-production adapter. The browser sends only the last four test-card digits;
  // full card number, expiry, and CVC never leave component memory and are never
  // logged or persisted. Replace with a Medusa payment session and Stripe Elements.
  return NextResponse.json({
    amount: 68 as const,
    authorizationId: `auth_${crypto.randomUUID()}`,
    authorizedAt: new Date().toISOString(),
    cardLast4: parsed.data.cardLast4,
    currency: "USD" as const,
    dataMode: "demo" as const,
    delivery: {
      date: "Wednesday · Sep 9" as const,
      location: "Hyde Park · Austin" as const,
      time: "6:30 PM" as const,
    },
    receiptId: `rcpt_${crypto.randomUUID()}`,
    seller: "Chef Maria L." as const,
    status: "held" as const,
  })
}

