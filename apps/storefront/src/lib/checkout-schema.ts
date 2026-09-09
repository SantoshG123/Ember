import { z } from "zod"

export const checkoutFormSchema = z
  .object({
    paymentMethod: z.enum(["saved", "new"]),
    cardNumber: z.string(),
    expiration: z.string(),
    cvc: z.string(),
    billingName: z.string().trim().min(2, "Enter the name shown on the payment method."),
    billingZip: z.string().regex(/^\d{5}$/, "Enter a valid 5-digit billing ZIP code."),
    authorizationAccepted: z.boolean().refine((accepted) => accepted, {
      message: "Confirm that you understand this $68 authorization.",
    }),
  })
  .superRefine((value, context) => {
    if (value.paymentMethod !== "new") return

    const cardDigits = value.cardNumber.replace(/\s/g, "")
    if (!/^\d{16}$/.test(cardDigits)) {
      context.addIssue({
        code: "custom",
        path: ["cardNumber"],
        message: "Enter a 16-digit test card number.",
      })
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value.expiration)) {
      context.addIssue({
        code: "custom",
        path: ["expiration"],
        message: "Use MM/YY format.",
      })
    }

    if (!/^\d{3,4}$/.test(value.cvc)) {
      context.addIssue({
        code: "custom",
        path: ["cvc"],
        message: "Enter a 3- or 4-digit security code.",
      })
    }
  })

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>

export const checkoutAuthorizationSchema = z.object({
  billingName: z.string().trim().min(2),
  billingZip: z.string().regex(/^\d{5}$/),
  cardLast4: z.string().regex(/^\d{4}$/),
  paymentMethod: z.enum(["saved", "new"]),
})

