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
    id: number,
    name: string,
    description: string,
    roleRequirement: "tier-1" | "tier-2" | "tier-3" | "admin"
}

export type messagesType = MessageType;