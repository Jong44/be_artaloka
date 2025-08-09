import { supabase } from "@/lib/supabase_client";
import { visionClient } from "@/lib/vision_client";
import { Expense } from "@/types/expense";
import { Console } from "console";
import OpenAI from "openai";

export class VisionService {
    private openai: OpenAI;
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY
        })
    }
    async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
        try {
            const [result] = await visionClient.textDetection({
                image: { content: imageBuffer }
            })

            const detections = result.textAnnotations
            if (!detections || detections.length === 0) {
                throw new Error('No text detected in image')
            }

            return detections[0].description || '';
        } catch (error) {
          if (error instanceof Error) {
            throw new Error(`Text extraction failed: ${error.message}`);
          } else {
            throw new Error('An unknown error occurred during text extraction');
          }
        }
    }

    async structureReceiptData(ocrText: string): Promise<Expense> {
    const prompt = `
    Analyze this receipt text and extract structured data. Return valid JSON only:

    ${ocrText}

    Extract:
    - code_receipt: receipt/invoice number
    - name_store: store name
    - date: transaction date (ISO format)
    - total_price: total amount
    - tax_price: tax amount (0 if not found)
    - category: expense category (Makanan, Transportasi,Belanja, Kesehatan, Pendidikan, Hiburan, Lainnya)
    - category_budget: budget category (Needs, Wants, Savings) (you must think about it based on the receipt)
    - details: array of items with name_product, quantity, unit, price_per_unit, total_price

    Return JSON format matching this structure exactly.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      });

      console.log("LLM response:", response.choices[0]?.message?.content);

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from LLM');

      return JSON.parse(content);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM processing failed: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred during LLM processing');
      }
    }
  }
}
