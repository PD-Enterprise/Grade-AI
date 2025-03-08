export type MessageType = {
    content: string,
    sender: string,
    time: string
}

export type ConversationType = {
    prompt: MessageType,
    response: MessageType
}

export type modalType = {
    id: 'gemini-2.0-flash_custom_trained'
    | 'gemini-2.0-flash'
    | 'llama-3.3-70b-versatile'
    | 'deepseek-r1-distill-llama-70b'
    | 'llama-3.3-70b-versatile_custom_trained'
    | 'deepseek-r1-distill-llama-70b_custom_trained',
    name: string,
    description: string,
    roleRequirement: "tier-1" | "tier-2" | "tier-3" | "admin",
    type: "custom" | "direct"
}

export type messagesType = MessageType;