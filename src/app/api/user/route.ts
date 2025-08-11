import { UserService } from "@/services/user_service";

export async function POST(request: Request) {
    try{
        const { city, gender, age, status, income, expense, is_savings, financial_goals, agent_role, userId } = await request.json();
        const userService = new UserService();

        // Insert personal data
        const personalData = {
            city,
            gender,
            age,
            status,
            income,
            expense,
            is_savings,
            financial_goals,
            agent_role
        };
        console.log("Inserting personal data:", personalData);
        const result = await userService.insertPersonalData(userId, personalData);
        console.log("Personal data insertion result:", result);
        if (!result) {
            return new Response(JSON.stringify({ error: "Failed to insert personal data" }), { status: 400 });
        }
        return new Response(JSON.stringify({ message: "Personal data inserted successfully", data: result, success: true }), { status: 201 });

    }
    catch (error) {
        if (error instanceof Error && error.message) {
            if (error.message.includes("Network error")) {
                return new Response(JSON.stringify({ error: "Network error, please try again later" }), { status: 503 });
            }
        }
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500 });
    }
}