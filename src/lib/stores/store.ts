import { writable } from "svelte/store";

export let welcomeMessage = writable(true)
export let userRole = writable('tier-1')

// Auth
export const auth0Client = writable(null);
export const isAuthenticated = writable(false);
export const user = writable({});
export const popupOpen = writable(false);
export const error = writable();