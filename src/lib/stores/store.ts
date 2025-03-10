import type { UserRole, ConversationType } from "$lib/types/types";
import { writable } from "svelte/store";

export let welcomeMessage = writable(true)
export let userRole = writable<UserRole>('tier-1')
export let conversationsList = writable<ConversationType[]>([
    {
        name: "Welcome to Grade AI",
        slug: "welcome-to-grade-ai",
        prompt: {
            content: "What is Grade AI?",
            sender: "User",
            time: "2023-03-30T10:00:00.000Z"
        },
        response: {
            content: `<h1 class="text-4xl"><b>Grade AI is the best AI Chat for students ever made.</b></h1><br> 

                        <h2 class="text-2xl">1. We're optimized for students.</h2>

                        <p>We have optimized each of our models for students, with custom prompting and much more to not only provide the answer, but to teach it.</p><br>

                        <h2 class="text-2xl">2. We have multiple models, not just one.</h2> 

                        <p>Want to use Claude for code? We got you. DeepSeek r1 for math? Of course. ChatGPT 4o for picture analysis? Why not.
                        When new models come out, we make them available within hours of release. </p><br>

                        <h2 class="text-2xl">3. We're cheap. (10rs/month)</h2>
                        <p>We're way cheaper than the price of ChatGPT or Claude.</p><br>

                       <h2 class="text-2xl">What are you waiting for?</h2>
                        Reply here to get started, or head over to conversation 1 to start a new chat.`,
            sender: "Gemini",
            time: "2023-03-30T10:00:00.000Z"
        }
    }])
export const currentSlug = writable('');
export const selectedModal = writable<
    | 'gemini-2.0-flash_custom_trained'
    | 'gemini-2.0-flash'
    | 'llama-3.3-70b-versatile'
    | 'llama-3.3-70b-versatile_custom_trained'
    | 'deepseek-r1-distill-llama-70b'
    | 'deepseek-r1-distill-llama-70b_custom_trained'
>('gemini-2.0-flash_custom_trained');

// Auth
export const auth0Client = writable(null);
export const isAuthenticated = writable(false);
export const user = writable({});
export const popupOpen = writable(false);
export const error = writable();