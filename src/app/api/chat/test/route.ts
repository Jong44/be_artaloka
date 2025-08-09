import { ChatService } from "@/services/chat_service";

export async function POST(request: Request) {
  const { content } = await request.json();
  const chatService = new ChatService();
  const response = await chatService.testOpenAI(content);
  return new Response(JSON.stringify(response));
}