export type MessageAuthor = "buyer" | "seller"
export type MessageDeliveryState = "failed" | "sending" | "sent"
export type ProposalStatus = "accepted" | "active"

export type MessageAttachment = {
  id: string
  name: string
  size: string
  type: "document" | "image"
}

export type MarketplaceMessage = {
  id: string
  author: MessageAuthor
  body: string
  sentAt: string
  status: MessageDeliveryState
  attachment?: MessageAttachment
}

export type ConversationParticipant = {
  id: string
  initials: string
  name: string
  responseNote: string
  role: string
  verified: boolean
}

export type DeliveryMilestone = {
  confirmed: boolean
  date: string
  location: string
  time: string
}

export type ConversationProposal = {
  dietary: string
  id: string
  location: string
  quantity: string
  rate: string
  requestId: string
  schedule: string
  status: ProposalStatus
  title: string
  milestone?: DeliveryMilestone
}

export type Conversation = {
  id: string
  messages: MarketplaceMessage[]
  participant: ConversationParticipant
  preview: string
  proposal: ConversationProposal
  requestTitle: string
  status: "active" | "archived"
  unreadCount: number
  updatedAt: string
}

export type MessagesWorkspaceData = {
  conversations: Conversation[]
  currentUser: {
    role?: MessageAuthor
    id: string
    initials: string
    name: string
  }
  unreadCount: number
}

export type SendMessageInput = {
  attachment?: MessageAttachment
  body: string
  conversationId: string
}

export type ConfirmMilestoneInput = {
  confirmed: boolean
  conversationId: string
}
