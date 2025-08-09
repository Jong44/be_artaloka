import { supabase } from "@/lib/supabase_client"

export class SessionService {
    async ensureSessionExists(userId: string, sessionId: string) {
        try {
            const { data: existingSession } = await supabase
                .from('chat_sessions')
                .select('id_session')
                .eq('id_user', userId)
                .single()

            if (!existingSession) {
                const { data: dataSession, error } = await supabase
                    .from('chat_sessions')
                    .insert({
                        id_user: userId,
                        created_at: new Date().toISOString(),
                    }).select().single()

                if (error || !dataSession) {
                    console.error('Error creating session:', error)
                    throw new Error('Failed to create chat session')
                }

                console.log(`✅ New session created: ${dataSession.id_session}`)
                return dataSession.id_session
            }
        } catch (error) {
            console.error('Error ensuring session exists:', error)
            throw new Error('Failed to ensure chat session exists')
        }

    }

    async createSession(userId: string) {
        try {
            const { data: sessionId, error } = await supabase
                .from('chat_sessions')
                .select('id_session')
                .eq('id_user', userId)
                .single()
            if (sessionId) {
                console.log(`✅ Session already exists: ${sessionId.id_session}`)
                return sessionId.id_session
            }
            const { data: newSession, error: insertError } = await supabase
                .from('chat_sessions')
                .insert({
                    id_user: userId,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single()
            if (insertError || !newSession) {
                console.error('Error creating session:', insertError)
                throw new Error('Failed to create chat session')
            }
            console.log(`✅ New session created: ${newSession.id_session}`)
            return newSession.id_session
        } catch (error) {
            console.error('Error creating session:', error)
            throw new Error('Failed to create chat session')
        }
    }
}