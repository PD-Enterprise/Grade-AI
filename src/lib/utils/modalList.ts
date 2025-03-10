import type { modalType } from "$lib/types/types";

export const modalList: modalType[] = [
    {
        name: 'Gemini 2.0 flash(Custom Trained)',
        id: 'gemini-2.0-flash_custom_trained',
        description: "Google's latest and greatest model, custom trained.",
        roleRequirement: ['tier-1', "tier-2", "tier-3", "admin"],
        type: 'custom'
    },
    {
        name: 'Gemini 2.0 flash',
        id: 'gemini-2.0-flash',
        description: "Google's latest and greatest model.",
        roleRequirement: ['tier-1', "tier-2", "tier-3", "admin"],
        type: 'direct'
    },
    {
        name: 'Llama 3.3',
        id: 'llama-3.3-70b-versatile',
        description: "Meta's powerful and adaptable LLM.",
        roleRequirement: ['tier-2', "tier-3", "admin"],
        type: 'direct'
    },
    {
        name: 'Llama 3.3(Custom Trained)',
        id: 'llama-3.3-70b-versatile_custom_trained',
        description: "Meta's powerful and adaptable LLM, custom trained.",
        roleRequirement: ['tier-2', "tier-3", "admin"],
        type: 'custom'
    },
    {
        name: 'Deepseek r1',
        id: 'deepseek-r1-distill-llama-70b',
        description: 'Distilled LLama-70B, optimized for efficiency.',
        roleRequirement: ['tier-3', "admin"],
        type: 'direct'
    },
    {
        name: 'Deepseek r1(Custom Trained)',
        id: 'deepseek-r1-distill-llama-70b_custom_trained',
        description: 'Distilled LLama-70B, optimized for efficiency, custom trained.',
        roleRequirement: ['tier-3', "admin"],
        type: 'custom'
    }
];