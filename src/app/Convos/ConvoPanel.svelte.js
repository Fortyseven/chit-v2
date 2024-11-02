import { writable } from "svelte/store"

export let currentConvo = writable(0)

export let conversationList = writable([
    {
        id: 1,
        title: "First Convo",
        messages: [
            {
                text: "Hello",
                role: "user",
            },
            {
                text: "Hi",
                role: "bot",
            },
            {
                text: "How are you?",
                role: "user",
            },
            {
                text: "I'm good",
                role: "bot",
            },
        ],
    },
    {
        id: 2,
        title: "Second Convo",
        messages: [
            {
                text: "Hey",
                role: "user",
            },
            {
                text: "Hello",
                role: "bot",
            },
            {
                text: "How's it going?",
                role: "user",
            },
            {
                text: "Good",
                role: "bot",
            },
        ],
    },
    {
        id: 3,
        title: "Third Convo",
        messages: [
            {
                text: "Hi",
                role: "user",
            },
            {
                text: "Hey",
                role: "bot",
            },
            {
                text: "What's up?",
                role: "user",
            },
            {
                text: "Not much",
                role: "bot",
            },
        ],
    },
])
