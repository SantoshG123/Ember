export type AuthMode = "sign-in" | "create-account"

export type AuthRole = "buyer" | "seller" | "both"

export type AuthAction = "authenticate" | "magic-link" | "recover"

export type AuthApiRequest =
  | {
      action: "authenticate"
      mode: AuthMode
      email: string
      password: string
      role?: AuthRole
    }
  | {
      action: "magic-link" | "recover"
      email: string
    }

export type AuthResult = {
  status: "success"
  action: AuthAction
  email: string
  role?: AuthRole
  accountId?: string
  message: string
  dataMode: "demo"
}

