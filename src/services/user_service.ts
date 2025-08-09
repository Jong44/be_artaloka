import { UserPersonalData } from "@/types/user";
import { supabase } from "@/lib/supabase_client";
import { DataIngestionService } from "./data_ingestion_service";
import { DataIngestationInternalData } from "@/types/knowladge";

export class UserService {
    private supabase;
    private dataIngestionService;
    constructor() {
        this.supabase = supabase;
        this.dataIngestionService = new DataIngestionService();
    }

    async createUser(name: string,email: string, password: string) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                throw new Error(`Error creating user: ${error.message}`);
            }
            if (!data.user) {
                throw new Error("User creation failed, no user data returned");
            }
            // Optionally, you can insert additional user data into a 'users' table
            const { data: userData, error: userError } = await this.supabase
                .from("users")
                .insert({
                    id_user: data.user.id,
                    email: data.user.email,
                    name: name,
                    // Add other default fields if necessary
                })
                .select("*");
            if (userError) {
                throw new Error(`Error inserting user data: ${userError.message}`);
            }
            console.log("User created successfully:", data);

            return data;
        } catch (error) {
            throw new Error(`Error creating user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async insertPersonalData(
        userId: string,
        personalData: UserPersonalData
    ) {
        try {
            const { data, error } = await this.supabase.from("users").update({
                city: personalData.city,
                gender: personalData.gender,
                age: personalData.age,
                status: personalData.status,
                income: personalData.income,
                expense: personalData.expense,
                is_savings: personalData.is_savings,
                financial_goals: personalData.financial_goals,
                agent_role: personalData.agent_role,
            }).eq("id_user", userId).select("*");

            console.log("Personal data inserted successfully:", data);

            if (error) {
                throw new Error(`Error inserting personal data: ${error.message}`);
            }

            const insertedData: DataIngestationInternalData = {
                userId: userId,
                data: {
                    category: "personal_data",
                    content: JSON.stringify(personalData),
                    metadata: {
                        userId: userId,
                        timestamp: new Date().toISOString(),
                    }
                }
            }
            // Optionally, you can also ingest this data for further processing
            const ingestionResult = await this.dataIngestionService.ingestInternalData(userId, insertedData);
            if (!ingestionResult) {
                throw new Error("Failed to ingest personal data");
            }
            console.log("Personal data ingested successfully:", ingestionResult);



            return data;
        } catch (error) {
            throw new Error(`Error inserting personal data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async loginUser(email: string, password: string) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw new Error(`Error logging in user: ${error.message}`);
            }

            console.log("User logged in successfully:", data);
            return data;
        } catch (error) {
            throw new Error(`Error logging in user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }



}