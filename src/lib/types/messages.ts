export type MessageType = {
    content: string,
    sender: string,
    time: string
}

export type ConversationType = {
    prompt: MessageType,
    response: MessageType
}

export type messagesType = MessageType;