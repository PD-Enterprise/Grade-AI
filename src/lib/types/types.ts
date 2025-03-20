export type MessageType = {
    content: string,
    sender: string,
    time: string
}

export interface ConversationType {
    id: string,
    name: string,
    slug: string,
    content: Array<Array<{
        prompt: MessageType | null,
        response: MessageType | null
    }>>
}

export type modalType = {
    id: 'gemini-2.0-flash_custom_trained'
    | 'gemini-2.0-flash'
    | 'llama-3.3-70b-versatile'
    | 'llama-3.3-70b-versatile_custom_trained'
    | 'deepseek-r1-distill-llama-70b'
    | 'deepseek-r1-distill-llama-70b_custom_trained',
    name: string,
    description: string,
    roleRequirement: Array<"tier-1" | "tier-2" | "tier-3" | "admin">,
    type: "custom" | "direct"
}
export type UserRole = "tier-1" | "tier-2" | "tier-3" | "admin";

export type messagesType = MessageType;