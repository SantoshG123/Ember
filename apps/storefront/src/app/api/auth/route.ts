import { NextResponse } from "next/server"
import { authApiSchema } from "@/lib/auth-schema"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = authApiSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Check the information you entered and try again.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { action, email, mode, role } = parsed.data

  // Demo adapter only. The password is validated above, then intentionally omitted:
  // it is never logged, stored, or returned. Replace this route with Medusa customer
  // authentication and a production email provider before launch.
  const message =
    action === "magic-link"
      ? "A secure sign-in link is ready for your inbox."
      : action === "recover"
        ? "Password reset instructions are ready for your inbox."
        : mode === "create-account"
          ? "Your EMBER account is ready."
          : "You are signed in."

  return NextResponse.json(
    {
      status: "success" as const,
      action,
      email,
      role,
      accountId: action === "authenticate" ? `acct_${crypto.randomUUID()}` : undefined,
      message,
      dataMode: "demo" as const,
    },
    { status: action === "authenticate" && mode === "create-account" ? 201 : 200 },
  )
}

