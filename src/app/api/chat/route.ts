import { BehaviorLearningService } from "@/services/behavior_learning_service"
import { ChatService } from "@/services/chat_service"
import { RAGService } from "@/services/rag_service"
import { SessionService } from "@/services/session_service"

const { NextResponse } = require('next/server')

const chatService = new ChatService()
const ragService = new RAGService()
const sessionService = new SessionService()
const behaviorService = new BehaviorLearningService()

export async function POST(req: Request) {
    const { userId, sessionId, message } = await req.json()

    // Validasi input
    if (!userId || !sessionId || !message) {
        return NextResponse.json({
            error: 'Missing required fields',
            required: ['userId', 'sessionId', 'message']
        })
    }

    try {
        let userMessage;
        let chatHistory = [];
        console.log(`🔄 Processing message for user ${userId} in session ${sessionId}`)

        // 1. Pastikan session exists atau buat baru
        const id_session = await sessionService.ensureSessionExists(userId, sessionId)
        
        console.log(`✅ Session ensured: ${id_session || sessionId}`)
        
        if (id_session) {
            userMessage = await chatService.saveMessage(
                id_session,
                'user',
                message,
            )
            chatHistory = await chatService.getChatHistory(id_session, 20)
        } else {
            userMessage = await chatService.saveMessage(
                sessionId,
                'user',
                message,
            )

            chatHistory = await chatService.getChatHistory(sessionId, 20)

        }
    

        const responseData = await ragService.generatePersonalizedResponse(
            userId,
            message,
            chatHistory
        )

        // 5. Simpan response AI ke database
        const aiMessage = await chatService.saveMessage(
            id_session || sessionId,
            'assistant',
            responseData.response,
            {
                context_used: responseData.context_used,
                confidence_score: responseData.confidence_score,
                processing_time: Date.now()
            }
        )

        // 6. Update behavior model (async, tidak blocking response)
        setTimeout(async () => {
            try {
                await behaviorService.analyzeBehaviorFromChat(userId, [
                    ...chatHistory,
                    userMessage,
                    aiMessage
                ])
                console.log(`🧠 Behavior model updated for user ${userId}`)
            } catch (error) {
                console.error('Error updating behavior model:', error)
            }
        }, 100)

        // 7. Return response
        return NextResponse.json({
            success: true,
            data: {
                message: aiMessage,
                metadata: {
                    context_sources: responseData.context_used,
                    confidence_score: responseData.confidence_score,
                    session_id: id_session || sessionId,
                }
            }
        })

    } catch (error) {
        console.error('❌ Error processing chat message:', error)
        return NextResponse.json({
            error: error.message || 'Failed to process chat message'
        }, { status: 500 })
    }
}
