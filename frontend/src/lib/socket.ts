"use client";
import { BACKEND_URL } from "@/types/internal";
import { io, Socket } from "socket.io-client";

export const socket = io(new URL(BACKEND_URL).origin, {
    transports: ['websocket', 'webtransport'],
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    auth: async (cb) => {
        if (typeof window === "undefined") {
            cb({});
            return;
        }

        try {
            const response = await fetch('/api/session');
            const data = await response.json();

            if (!data?.token) {
                cb({});
                return;
            }

            cb({ token: data.token });
        } catch (error) {
            console.error("Failed to fetch session for socket:", error);
            cb({});
        }
    },
});

export {
    Socket
}