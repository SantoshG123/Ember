"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type {
  ConfirmMilestoneInput,
  MarketplaceMessage,
  MessageAuthor,
  MessagesWorkspaceData,
  SendMessageInput,
} from "@/lib/message-types"

import { invalidateMarketplace, marketplaceFetch, useMarketplaceMode, usesPersistentMarketplace } from "@/lib/marketplace-data"

const actorQueryKey = (actor: MessageAuthor) => ["messages-workspace", actor] as const
const endpoint = (actor: MessageAuthor) => `/api/messages?role=${actor}`

export const messagesQueryKey = ["messages-workspace"] as const

async function getMessagesWorkspace(actor: MessageAuthor): Promise<MessagesWorkspaceData> {
  return marketplaceFetch<MessagesWorkspaceData>(endpoint(actor))
}

async function sendMessage(input: SendMessageInput, actor: MessageAuthor) {
  const response = await fetch(endpoint(actor), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "Your message could not be sent.")
  }

  return response.json() as Promise<{ message: MarketplaceMessage }>
}

async function confirmMilestone(input: ConfirmMilestoneInput, actor: MessageAuthor) {
  const response = await fetch(endpoint(actor), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(body?.message ?? "Delivery details could not be updated.")
  }

  return response.json() as Promise<ConfirmMilestoneInput>
}

export function useMessagesWorkspace(actor: MessageAuthor = "buyer") {
  useMarketplaceMode()
  return useQuery({ queryKey: actorQueryKey(actor), queryFn: () => getMessagesWorkspace(actor), retry: 1 })
}

export function useSendMessage(actor: MessageAuthor = "buyer") {
  const messagesQueryKey = actorQueryKey(actor)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SendMessageInput) => sendMessage(input, actor),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: messagesQueryKey })
      const previous = queryClient.getQueryData<MessagesWorkspaceData>(messagesQueryKey)
      const optimisticId = `sending-${crypto.randomUUID()}`
      const optimisticMessage: MarketplaceMessage = {
        id: optimisticId,
        author: previous?.currentUser.role ?? actor,
        body: input.body,
        sentAt: "Now",
        status: "sending",
        attachment: input.attachment,
      }

      queryClient.setQueryData<MessagesWorkspaceData>(messagesQueryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          conversations: current.conversations.map((conversation) =>
            conversation.id === input.conversationId
              ? {
                  ...conversation,
                  messages: [...conversation.messages, optimisticMessage],
                  preview: input.body || input.attachment?.name || "Attachment",
                  updatedAt: "Now",
                }
              : conversation,
          ),
        }
      })

      return { optimisticId, previous }
    },
    onSettled: async () => {
      if (usesPersistentMarketplace(queryClient)) await invalidateMarketplace(queryClient)
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(messagesQueryKey, context.previous)
    },
    onSuccess: (result, input, context) => {
      queryClient.setQueryData<MessagesWorkspaceData>(messagesQueryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          conversations: current.conversations.map((conversation) =>
            conversation.id === input.conversationId
              ? {
                  ...conversation,
                  messages: conversation.messages.map((message) =>
                    message.id === context?.optimisticId ? result.message : message,
                  ),
                }
              : conversation,
          ),
        }
      })
    },
  })
}

export function useConfirmDelivery(actor: MessageAuthor = "buyer") {
  const messagesQueryKey = actorQueryKey(actor)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ConfirmMilestoneInput) => confirmMilestone(input, actor),
    onSettled: async () => {
      if (usesPersistentMarketplace(queryClient)) await invalidateMarketplace(queryClient)
    },
    onSuccess: (result) => {
      queryClient.setQueryData<MessagesWorkspaceData>(messagesQueryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          conversations: current.conversations.map((conversation) =>
            conversation.id === result.conversationId && conversation.proposal.milestone
              ? {
                  ...conversation,
                  proposal: {
                    ...conversation.proposal,
                    milestone: {
                      ...conversation.proposal.milestone,
                      confirmed: result.confirmed,
                    },
                  },
                }
              : conversation,
          ),
        }
      })
    },
  })
}


export function useMarkConversationRead(actor: MessageAuthor = "buyer") {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { conversationId: string }) => marketplaceFetch<{ conversationId: string; unreadCount: number }>(endpoint(actor), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, action: "read" }),
    }),
    onSuccess: async (_result, input) => {
      queryClient.setQueryData<MessagesWorkspaceData>(actorQueryKey(actor), (current) => {
        if (!current) return current
        const conversations = current.conversations.map((conversation) =>
          conversation.id === input.conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        )
        return { ...current, conversations, unreadCount: conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0) }
      })
      if (usesPersistentMarketplace(queryClient)) await invalidateMarketplace(queryClient)
    },
  })
}
