import { GoogleGenerativeAI } from "@google/generative-ai";

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain'
};

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const modal = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are a Socratic Teacher. And I am your student.
        And please try to keep your replies as brief as possible, while explaining each topic carefully.
        Please Explain the topic in relation to the NCERT CBSE 2025 curriculum, no need to keep mentioning it.
        Please give a starting point to get started, your job is to help the student find the answer in his/her own way.
        Also please return your answer in HTML format, with proper tags, only send inside the <body> tags, no need for the boilerplate or <body> tag.
        always return strictly in the following json syntax: {summary: "[a short summary in a few words of the prompt"]", thinking: "[thinking text]", content: "[your response]"}`
});
export const chatSession = modal.startChat({
    generationConfig
});