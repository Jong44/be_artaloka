import { supabase } from "@/lib/supabase_client";
import { OpenAIService } from "./openai_service";
import { DataIngestationInternalData } from "@/types/knowladge";




// services/dataIngestionService.ts
export class DataIngestionService {
  private supabase = supabase;
  private openAIService = new OpenAIService();


  async ingestInternalData(userId: string, data: DataIngestationInternalData) {
    const dataToString = JSON.stringify(data);
    if (!dataToString || dataToString.trim() === "") {
      throw new Error("No data provided for ingestion");
    }

    // Check if the data has already been ingested
    const alreadyIngested = await this.checkAlreadyIngestedInternalData(userId,
      data);
    if (alreadyIngested) {
      const { data: existingData, error } = await this.supabase
        .from("knowledge_entries")
        .update({
          content: data.data.content,
          embedding: await this.openAIService.generateEmbedding(dataToString),
          metadata: data.data.metadata
        })
        .eq("id_knowladge", alreadyIngested)
        .select("*")
        .single();
      if (error) {
        throw new Error(`Error updating existing data: ${error.message}`);
      }
      return existingData;
    }

    // Process user personal data
    const embedding = await this.openAIService.generateEmbedding(dataToString);

    if (!embedding) {
      throw new Error("Failed to generate embedding for the data");
    }
    try {
      const { data: result, error } = await this.supabase
        .from("knowledge_entries")
        .insert({
          id_user: data.userId,
          source_type: 'internal',
          category: data.data.category,
          content: data.data.content,
          embedding,
          metadata: data.data.metadata
        })
        .select("*");

      if (error) {
        throw new Error(`Error inserting internal data: ${error.message}`);
      }
      return result;
    } catch (error) {
      throw new Error(`Error ingesting internal data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async ingestExternalData() {
    // Fetch cost of living, market prices, etc.
    // const externalSources = [
    //   this.fetchCostOfLivingData(),
    //   this.fetchMarketPrices(),
    //   this.fetchEconomicIndicators()
    // ];

    // const results = await Promise.all(externalSources);
    // Process and store with embeddings
  }

  private async checkAlreadyIngestedInternalData(userId: string, data: DataIngestationInternalData) {
    try {
      const { data: existingData, error } = await this.supabase
        .from("knowledge_entries")
        .select("id_knowladge")
        .eq("id_user", userId)
        .eq("source_type", 'internal')
        .eq("category", data.data.category)
        .eq("content", data.data.content)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no data found
        throw new Error(`Error checking existing data: ${error.message}`);
      }
      console.log("Existing data found:", existingData);

      if (existingData) {
        return existingData.id_knowladge;
      }
      return null;
    } catch (error) {
      throw new Error(`Error checking existing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}