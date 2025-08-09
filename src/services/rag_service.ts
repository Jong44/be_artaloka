import { Message } from "@/types/chat";
import { BehaviorLearningService } from "./behavior_learning_service";
import { OpenAIService } from "./openai_service";
import { supabase } from "@/lib/supabase_client";

export class RAGService {
    private openAIService: OpenAIService;
    private behaviorService: BehaviorLearningService;

    constructor() {
        this.openAIService = new OpenAIService();
        this.behaviorService = new BehaviorLearningService();
    }

    async retrieveRelevantContext(userId: string, query: string, limit: number = 5) {
        try {
            // Generate embedding untuk query
            const queryEmbedding = await this.openAIService.generateEmbedding(query)

            // Convert array to PostgreSQL vector format
            const vectorString = `[${queryEmbedding.join(',')}]`

            // Cari di knowledge base personal user
            const { data: personalContext, error: personalError } = await supabase.from('knowledge_entries')
                .select('content, metadata')
                .eq('id_user', userId)
                .limit(limit)


            if (personalError) {
                console.error('Error fetching personal context:', personalError)
            }

            // Cari di knowledge base eksternal
            const { data: externalContext, error: externalError } = await supabase
                .rpc('match_external_knowledge', {
                    query_embedding: vectorString,
                    match_threshold: 0.75,
                    match_count: 3
                })

            if (externalError) {
                console.error('Error fetching external context:', externalError)
            }

            return {
                personal: personalContext || [],
                external: externalContext || [],
                query_embedding: queryEmbedding
            }
        } catch (error) {
            console.error('Error retrieving context:', error)
            return { personal: [], external: [], query_embedding: null }
        }
    }

    async generatePersonalizedResponse(
        userId: string,
        query: string,
        chatHistory: Message[] = []
    ) {
        try {
            // 1. Retrieve relevant context
            const context = await this.retrieveRelevantContext(userId, query)
            console.log(`🔍 Retrieved context for user ${userId}:`, context)

            // 2. Get user behavior model
            const behaviorModel = await this.behaviorService.getBehaviorModel(userId)
            console.log(`👤 Behavior model for user ${userId}:`, behaviorModel)

            // 3. Build personalized system prompt
            const systemPrompt = this.buildPersonalizedSystemPrompt(context, behaviorModel)

            // 4. Prepare conversation history
            const conversationHistory = this.prepareConversationHistory(chatHistory, 10)

            // 5. Generate response
            const response = await this.openAIService.generateChatResponse(
                [
                    ...conversationHistory,
                    { name: "User", role: "user", content: query }
                ],
                systemPrompt,
                this.getTemperatureBasedOnBehavior(behaviorModel)
            )

            return {
                response,
                context_used: {
                    personal_sources: context.personal.length,
                    external_sources: context.external.length
                },
                confidence_score: this.calculateResponseConfidence(context, behaviorModel)
            }
        } catch (error) {
            console.error('Error generating personalized response:', error)
            return {
                response: "Maaf, saya sedang mengalami kendala. Bisakah Anda mengulangi pertanyaan?",
                context_used: { personal_sources: 0, external_sources: 0 },
                confidence_score: 0.1
            }
        }
    }

    private prepareConversationHistory(messages: Message[], limit: number = 10) {
        return messages
            .slice(-limit) // Ambil N pesan terakhir
            .map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }))
    }

    private getTemperatureBasedOnBehavior(behaviorModel: any): number {
        if (!behaviorModel?.communication_style) return 0.7

        const style = behaviorModel.communication_style

        // Formal style = lower temperature (more consistent)
        if (style.formality_level === 'formal') return 0.5

        // Casual style = higher temperature (more creative)
        if (style.formality_level === 'casual') return 0.8

        return 0.7 // default
    }

    private calculateResponseConfidence(context: any, behaviorModel: any): number {
        let confidence = 0.5 // base confidence

        // Tambah confidence berdasarkan context
        confidence += context.personal.length * 0.1 // personal context adds confidence
        confidence += context.external.length * 0.05 // external context adds some confidence

        // Tambah confidence berdasarkan behavior model
        if (behaviorModel?.confidence_score) {
            confidence += behaviorModel.confidence_score * 0.3
        }

        return Math.min(0.95, confidence) // max 95%
    }

    private buildPersonalizedSystemPrompt(context: any, behaviorModel: any): string {
        console.log('Building personalized system prompt with context:', context)
        console.log('Behavior model:', behaviorModel)
        let prompt = `
        Anda adalah asisten AI yang cerdas dan bernama ArtaLoka. Tugas Anda adalah memberikan jawaban yang relevan dan dipersonalisasi berdasarkan pengetahuan tentang user dan data kontekstual.

        KONTEKS PERSONAL USER:
        ${context.personal.map((item: any) => `- ${item.content}`).join('\n')}

        INFORMASI EKSTERNAL RELEVAN:
        ${context.external.map((item: any) => `- ${item.content}`).join('\n')}
        `

        // Personalisasi berdasarkan behavior model
        if (behaviorModel) {
            prompt += `\nPROFIL KEPRIBADIAN USER:
`

            if (behaviorModel.communication_style) {
                const style = behaviorModel.communication_style
                prompt += `- Gaya komunikasi: ${style.formality_level}, preferensi pesan ${style.message_length_preference}
`

                if (style.formality_level === 'formal') {
                    prompt += `- Gunakan bahasa yang sopan dan formal
`
                } else if (style.formality_level === 'casual') {
                    prompt += `- Gunakan bahasa yang santai dan friendly
`
                }

                if (style.message_length_preference === 'short') {
                    prompt += `- Berikan jawaban yang concise dan to-the-point
`
                } else if (style.message_length_preference === 'long') {
                    prompt += `- Berikan penjelasan yang detail dan komprehensif
`
                }
            }

            if (behaviorModel.interests) {
                prompt += `- Minat utama: ${behaviorModel.interests.primary_interests?.join(', ') || 'belum teridentifikasi'}
`
            }

            if (behaviorModel.goals) {
                prompt += `- Tujuan: ${behaviorModel.goals.short_term_goals?.join(', ') || 'belum teridentifikasi'}
`
            }
        }

        prompt += `
INSTRUKSI RESPONSE:
1. Gunakan informasi personal dan eksternal di atas untuk memberikan jawaban yang relevan
2. Sesuaikan gaya bahasa dengan preferensi user
3. Jika tidak ada informasi yang relevan, berikan jawaban umum yang membantu
4. Selalu berikan jawaban dalam Bahasa Indonesia kecuali diminta sebaliknya
5. Jika menyangkut data finansial atau ekonomi, pastikan informasi akurat dan terkini
6. Berikan saran yang actionable dan praktis

Berikan response yang natural, membantu, dan sesuai dengan kepribadian user.
`

        return prompt
    }
}