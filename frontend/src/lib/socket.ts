"use client";
import { io, Socket } from "socket.io-client";
import { useSupabaseClient } from "@/lib/supabase/client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api", ''), {
    transports: ['websocket', 'webtransport'],
    auth: async (cb) => {
        const supabase = useSupabaseClient()
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
            cb({})
            return
        }

        cb({ token: data.session.access_token })
    },
});

export {
    Socket
}