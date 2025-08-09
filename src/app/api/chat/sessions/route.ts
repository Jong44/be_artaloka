import { SessionService } from "@/services/session_service";

export async function POST(request: Request) {
    const { userId } = await request.json();
    if (!userId) {
        return new Response(JSON.stringify({ success: false, message: "Missing userId" }), { status: 400 });
    }
    const sessionService = new SessionService();
    try {
        const sessionId = await sessionService.createSession(userId);
        return new Response(JSON.stringify({ success: true, message: "Session created successfully", data: sessionId }), { status: 201 });
    } catch (error) {
        console.error('Error creating session:', error);
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}