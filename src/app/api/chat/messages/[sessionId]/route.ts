import { ChatService } from "@/services/chat_service";

const chatService = new ChatService();

export async function GET(request: Request,
    {params} : { params: Promise<{ sessionId: string }> }
){
    const sessionId = (await params).sessionId;
    if (!sessionId) {
        return new Response(JSON.stringify({ success: false, message: 'Missing sessionId' }), { status: 400 });
    }

    const chatHistory = await chatService.getChatHistory(sessionId, 20);

    if (!chatHistory || chatHistory.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'No chat history found' }), { status: 404 });
    }


    return new Response(JSON.stringify({
        success: true,
        message: 'Chat history retrieved successfully',
        data: chatHistory   
    }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
    });


    
}