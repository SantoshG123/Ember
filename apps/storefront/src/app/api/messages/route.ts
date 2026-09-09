import { NextResponse } from "next/server"
import { getMarketplaceDataMode, guardMarketplaceMutation, proxyMarketplace } from "@/lib/marketplace-server"
import type {
  ConfirmMilestoneInput,
  MessagesWorkspaceData,
  SendMessageInput,
} from "@/lib/message-types"

const workspace: MessagesWorkspaceData = {
  currentUser: { id: "buyer-jordan", initials: "JL", name: "Jordan Lee" },
  unreadCount: 3,
  conversations: [
    {
      id: "conversation-maria",
      participant: {
        id: "seller-maria",
        initials: "ML",
        name: "Chef Maria L.",
        responseNote: "Usually replies within an hour",
        role: "Verified meal-prep seller",
        verified: true,
      },
      requestTitle: "Weekly homemade Italian dinners",
      preview: "I put together next week’s menu.",
      updatedAt: "10:42 AM",
      unreadCount: 0,
      status: "active",
      proposal: {
        id: "proposal-maria",
        requestId: "R-8924",
        title: "Weekly homemade Italian dinners",
        status: "accepted",
        rate: "$68 per delivery",
        quantity: "4 portions",
        schedule: "Wednesdays · 6:30 PM",
        location: "Hyde Park · Austin",
        dietary: "No shellfish",
        milestone: {
          confirmed: false,
          date: "Wednesday · Sep 9",
          time: "6:30 PM",
          location: "Hyde Park",
        },
      },
      messages: [
        {
          id: "message-maria-1",
          author: "seller",
          body: "Hi Jordan — I’ve put together a proposed menu for next week based on your preferences. Let me know what you think.",
          sentAt: "10:42 AM",
          status: "sent",
          attachment: {
            id: "attachment-menu",
            name: "Menu_Proposal_Sept_W2.pdf",
            size: "1.2 MB",
            type: "document",
          },
        },
        {
          id: "message-jordan-1",
          author: "buyer",
          body: "This looks fantastic, Maria. The truffle risotto sounds amazing. We’re good to go for Wednesday.",
          sentAt: "10:45 AM",
          status: "sent",
        },
      ],
    },
    {
      id: "conversation-lawn",
      participant: {
        id: "seller-green-thumb",
        initials: "GT",
        name: "Green Thumb Pros",
        responseNote: "Usually replies the same day",
        role: "Verified garden-care team",
        verified: true,
      },
      requestTitle: "Biweekly native garden maintenance",
      preview: "The yard looks ready for the fall trim.",
      updatedAt: "Yesterday",
      unreadCount: 2,
      status: "active",
      proposal: {
        id: "proposal-lawn",
        requestId: "R-8917",
        title: "Biweekly native garden maintenance",
        status: "active",
        rate: "$112 per visit",
        quantity: "Front and back garden",
        schedule: "Every other Friday",
        location: "Bouldin Creek · Austin",
        dietary: "Native plants only",
      },
      messages: [
        {
          id: "message-lawn-1",
          author: "seller",
          body: "The yard looks ready for the fall trim. I can send a short care plan before we begin.",
          sentAt: "Yesterday",
          status: "sent",
        },
      ],
    },
    {
      id: "conversation-tutor",
      participant: {
        id: "seller-chen",
        initials: "AC",
        name: "Dr. A. Chen",
        responseNote: "Usually replies within two hours",
        role: "Verified mathematics tutor",
        verified: true,
      },
      requestTitle: "Calculus tutoring for a college freshman",
      preview: "Here are the notes from our first session.",
      updatedAt: "Tue",
      unreadCount: 1,
      status: "active",
      proposal: {
        id: "proposal-tutor",
        requestId: "R-8898",
        title: "Weekly calculus tutoring",
        status: "active",
        rate: "$58 per session",
        quantity: "60 minutes",
        schedule: "Tuesdays · 5:00 PM",
        location: "Travis Heights · Austin",
        dietary: "In-person sessions",
      },
      messages: [
        {
          id: "message-tutor-1",
          author: "seller",
          body: "Here are the notes from our first session. The practice set focuses on limits and continuity.",
          sentAt: "Tue · 6:12 PM",
          status: "sent",
        },
      ],
    },
  ],
}

function messageActor(request: Request) {
  return new URL(request.url).searchParams.get("role") === "seller" ? "seller" : "buyer"
}

export async function GET(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "messages", messageActor(request))
  return NextResponse.json(workspace)
}

export async function POST(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "messages", messageActor(request))
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = (await request.json().catch(() => null)) as SendMessageInput | null
  const text = typeof body?.body === "string" ? body.body.trim() : ""

  if (!body?.conversationId || (!text && !body.attachment)) {
    return NextResponse.json({ message: "Write a message or add an attachment." }, { status: 400 })
  }

  if (text.length > 1000) {
    return NextResponse.json({ message: "Keep your message under 1,000 characters." }, { status: 400 })
  }

  if (!workspace.conversations.some((conversation) => conversation.id === body.conversationId)) {
    return NextResponse.json({ message: "That conversation is no longer available." }, { status: 404 })
  }

  return NextResponse.json({
    message: {
      id: `message-${crypto.randomUUID()}`,
      author: "buyer",
      body: text,
      sentAt: "Now",
      status: "sent",
      attachment: body.attachment,
    },
  })
}

export async function PATCH(request: Request) {
  if (getMarketplaceDataMode() !== "demo") return proxyMarketplace(request, "messages", messageActor(request))
  const blocked = guardMarketplaceMutation(request)
  if (blocked) return blocked
  const body = (await request.json().catch(() => null)) as (ConfirmMilestoneInput & { action?: string }) | null
  const conversation = workspace.conversations.find((item) => item.id === body?.conversationId)

  if (body?.action === "read" && conversation) return NextResponse.json({ conversationId: conversation.id, unreadCount: 0 })

  if (!body || typeof body.confirmed !== "boolean" || !conversation?.proposal.milestone) {
    return NextResponse.json({ message: "That delivery milestone is unavailable." }, { status: 400 })
  }

  return NextResponse.json(body)
}
