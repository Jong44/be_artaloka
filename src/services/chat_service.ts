import { Message } from "@/types/chat";
import { BehaviorLearningService } from "./behavior_learning_service";
import { DataIngestionService } from "./data_ingestion_service";
import { OpenAIService } from "./openai_service";
import { RAGService } from "./rag_service";
import { supabase } from "@/lib/supabase_client";
import { v4 as uuidv4 } from 'uuid'

export class ChatService {
    private openaAIService: OpenAIService

    private ragService: RAGService
    private behaviorService: BehaviorLearningService
    private dataService: DataIngestionService
    constructor() {
        this.openaAIService = new OpenAIService();
        this.ragService = new RAGService();
        this.behaviorService = new BehaviorLearningService();
        this.dataService = new DataIngestionService();
    }

    async testOpenAI(
        content: string,
    ) {
        try {
            const response = await this.openaAIService.generateChatResponse(
                [
                    { name: "user", role: "user", content },
                ],
                "You are a helpful assistant.",
                0.7

            );
            return response;
        } catch (error) {
            console.error("Error in testOpenAI:", error);
            throw new Error("Failed to test OpenAI service");
        }
    }

    async generateResponse(
        userId: string,
        query: string,
        chatHistory: Message[] = []
    ) {
        try {
            return await this.ragService.generatePersonalizedResponse(userId, query, chatHistory);
        } catch (error) {
            console.error("Error generating response:", error);
            throw new Error("Failed to generate response");
        }
    }

    async saveMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        metadata: Record<string, any> = {}
    ) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                id_session: sessionId,
                role,
                content,
                metadata,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving message:', error)
            throw new Error(`Failed to save ${role} message`)
        }

        return data
    }

    async getChatHistory(sessionId: string, limit: number = 20) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id_session', sessionId)
            .order('created_at', { ascending: true })
            .limit(limit)

        if (error) {
            console.error('Error fetching chat history:', error)
            throw new Error('Failed to fetch chat history')
        }

        return data || []
    }



}