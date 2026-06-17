import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            return NextResponse.json(
                { message: "Unauthorized", token: null },
                { status: 401 }
            );
        }

        return NextResponse.json({
            token: data.session.access_token,
            user: data.session.user
        });
    } catch (error) {
        console.error("Error di API Session:", error);
        return NextResponse.json(
            { message: "Internal Server Error", token: null },
            { status: 500 }
        );
    }
}