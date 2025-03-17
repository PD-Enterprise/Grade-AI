import type { UserRole, ConversationType } from "$lib/types/types";
import { writable } from "svelte/store";

export let welcomeMessage = writable(true)
export let userRole = writable<UserRole>('tier-1')
export let conversationsList = writable<ConversationType[]>([])
export const currentSlug = writable('');
export const selectedModal = writable<
    | 'gemini-2.0-flash_custom_trained'
    | 'gemini-2.0-flash'
    | 'llama-3.3-70b-versatile'
    | 'llama-3.3-70b-versatile_custom_trained'
    | 'deepseek-r1-distill-llama-70b'
    | 'deepseek-r1-distill-llama-70b_custom_trained'
>('gemini-2.0-flash_custom_trained');
export const sidebarStatus = writable("opened")

// Auth
export const auth0Client = writable(null);
export const isAuthenticated = writable(false);
export const user = writable({});
export const popupOpen = writable(false);
export const error = writable();