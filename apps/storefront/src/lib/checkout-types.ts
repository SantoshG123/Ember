export type PaymentMethod = "saved" | "new"

export type CheckoutAuthorizationInput = {
  billingName: string
  billingZip: string
  cardLast4: string
  paymentMethod: PaymentMethod
}

export type CheckoutReceipt = {
  amount: 68
  authorizationId: string
  authorizedAt: string
  cardLast4: string
  currency: "USD"
  dataMode: "demo"
  delivery: {
    date: "Wednesday · Sep 9"
    location: "Hyde Park · Austin"
    time: "6:30 PM"
  }
  receiptId: string
  seller: "Chef Maria L."
  status: "held"
}

