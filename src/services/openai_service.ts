import OpenAI from 'openai'

export class OpenAIService {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    })
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        input: text,
        model: "text-embedding-3-small",
      })
      console.log('Embedding generated:', response.data[0].embedding)
      if (!response.data || response.data.length === 0 || !response.data[0].embedding) {
        throw new Error("No embedding data returned");
      }
      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw new Error('Failed to generate embedding')
    }
  }

  async generateChatResponse(
    messages: any[],
    systemPrompt: string,
    temperature: number = 0.7
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature,
        max_tokens: 500,
        stream: true,
      })

      const chunks: string[] = []
      for await (const chunk of response) {
        if (chunk.choices[0].delta.content) {
          chunks.push(chunk.choices[0].delta.content)
        }
        
      }
      return chunks.join('')
    } catch (error) {
      console.error('Error generating chat response:', error)
      throw new Error('Failed to generate response')
    }
  }
}