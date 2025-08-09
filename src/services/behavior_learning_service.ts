import { Message } from "@/types/chat";
import { OpenAIService } from "./openai_service";
import { supabase } from "@/lib/supabase_client";

export class BehaviorLearningService {
    private openAiService: OpenAIService;
    constructor() {
        this.openAiService = new OpenAIService();
    }

    private async analyzeCommunicationStyle(messages: Message[]) {
        const userMessages = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n')

        const prompt = `
    Analisis gaya komunikasi user berdasarkan pesan-pesan berikut:
    
    ${userMessages}
    
    Berikan analisis dalam format JSON dengan fields:
    - formality_level: "formal" | "casual" | "mixed"
    - message_length_preference: "short" | "medium" | "long"
    - question_style: "direct" | "exploratory" | "detailed"
    - emotion_expression: "high" | "medium" | "low"
    - preferred_language: "indonesian" | "english" | "mixed"
    
    Hanya return JSON tanpa penjelasan tambahan.
    `

        const response = await this.openAiService.generateChatResponse(
            [{ name: "User", role: "user", content: prompt }],
            "You are an expert in communication pattern analysis. Return only valid JSON.",
            0.3
        )

        try {
            return JSON.parse(response || '{}')
        } catch {
            return {
                formality_level: "casual",
                message_length_preference: "medium",
                question_style: "direct",
                emotion_expression: "medium",
                preferred_language: "mixed"
            }
        }
    }

    async analyzeBehaviorFromChat(userId: string, messages: Message[]) {
        try {

            const recentMessages = messages.slice(-10);

            const communicationStyle = await this.analyzeCommunicationStyle(recentMessages)

            const interests = await this.identifyInterests(recentMessages)

            const activeTimePatterns = this.analyzeActiveTimePatterns(recentMessages)

            const goals = await this.analyzeGoals(recentMessages)




            await this.updateBehaviorModel(userId, {
                communication_style: communicationStyle,
                interests: interests,
                goals: goals,
                active_time_patterns: activeTimePatterns,
                last_analysis: new Date().toISOString(),
                confidence_score: this.calculateConfidenceScore(messages.length)
            })

            // Simulate saving the analysis to a database or returning it
            console.log(`✅ Behavior analysis completed for user ${userId}`)
        } catch (error) {
            console.error('Error analyzing behavior:', error);
            throw new Error(`Behavior analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async identifyInterests(messages: Message[]) {
        const conversationText = messages
            .map(m => `${m.role}: ${m.content}`)
            .join('\n')

        const prompt = `
    Identifikasi minat dan topik yang sering dibahas user:
    
    ${conversationText}
    
    Return JSON dengan format:
    {
      "primary_interests": ["topic1", "topic2", ...],
      "secondary_interests": ["topic3", "topic4", ...],
      "interest_categories": {
        "finance": 0.8,
        "technology": 0.6,
        "lifestyle": 0.4
      }
    }
    
    Score dari 0-1 berdasarkan seberapa sering topik muncul.
    `

        const response = await this.openAiService.generateChatResponse(
            [{ name: "User", role: "user", content: prompt }],
            "You are an expert in interest analysis. Return only valid JSON.",
            0.3
        )

        try {
            return JSON.parse(response || '{}')
        } catch {
            return {
                primary_interests: [],
                secondary_interests: [],
                interest_categories: {}
            }
        }
    }

    private async analyzeGoals(messages: Message[]) {
        const userMessages = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n')

        const prompt = `
    Identifikasi tujuan dan goals user berdasarkan pertanyaan-pertanyaannya:
    
    ${userMessages}
    
    Return JSON:
    {
      "short_term_goals": ["goal1", "goal2"],
      "long_term_goals": ["goal3", "goal4"],
      "goal_categories": {
        "financial": ["saving money", "investment"],
        "personal": ["skill development"],
        "professional": ["career growth"]
      },
      "urgency_level": "high" | "medium" | "low"
    }
    `

        const response = await this.openAiService.generateChatResponse(
            [{ name: "User", role: "user", content: prompt }],
            "You are an expert in goal analysis. Return only valid JSON.",
            0.3
        )

        try {
            return JSON.parse(response || '{}')
        } catch {
            return {
                short_term_goals: [],
                long_term_goals: [],
                goal_categories: {},
                urgency_level: "medium"
            }
        }
    }

    private analyzeActiveTimePatterns(messages: Message[]) {
        const hourCounts: Record<number, number> = {}
        const dayOfWeekCounts: Record<number, number> = {}

        messages.forEach(message => {
            const date = new Date(message.created_at)
            const hour = date.getHours()
            const dayOfWeek = date.getDay()

            hourCounts[hour] = (hourCounts[hour] || 0) + 1
            dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
        })

        // Find peak hours dan days
        const peakHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([hour]) => parseInt(hour))

        const peakDays = Object.entries(dayOfWeekCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([day]) => parseInt(day))

        return {
            peak_hours: peakHours,
            peak_days: peakDays,
            total_interactions: messages.length,
            avg_daily_interactions: messages.length / 7
        }
    }

    private async updateBehaviorModel(userId: string, behaviorData: any) {
       const { data, error } = await supabase
            .from('user_behaviors').select('id_behavior')
            .eq('id_user', userId)
            .eq('behavior_type', 'comprehensive_analysis')
        .single()

        if (data) {
            // Update existing behavior model
            const { error: updateError } = await supabase
                .from('user_behaviors')
                .update({
                    behavior_data: behaviorData,
                    confidence_score: behaviorData.confidence_score,
                    last_updated: new Date().toISOString(),
                })
                .eq('id_behavior', data.id_behavior)

            if (updateError) {
                console.error('Error updating behavior model:', updateError)
                throw updateError
            }
        } else {
            // Insert new behavior model
            const { error: insertError } = await supabase
                .from('user_behaviors')
                .insert({
                    id_user: userId,
                    behavior_type: 'comprehensive_analysis',
                    behavior_data: behaviorData,
                    confidence_score: behaviorData.confidence_score,
                    last_updated: new Date().toISOString(),
                })

            if (insertError) {
                console.error('Error inserting behavior model:', insertError)
                throw insertError
            }
        }

        if (error) {
            console.error('Error updating behavior model:', error)
            throw error
        }
    }

    private calculateConfidenceScore(interactionCount: number): number {
        // Semakin banyak interaksi, semakin tinggi confidence
        // Max confidence = 0.95, min = 0.1
        return Math.min(0.95, 0.1 + (interactionCount * 0.05))
    }

    async getBehaviorModel(userId: string) {
        const { data, error } = await supabase
            .from('user_behaviors')
            .select('*')
            .eq('id_user', userId)
            .eq('behavior_type', 'comprehensive_analysis')
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error getting behavior model:', error)
            return null
        }

        return data?.behavior_data || null
    }

}