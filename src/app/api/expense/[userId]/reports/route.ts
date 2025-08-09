import { ExpenseService } from "@/services/expense_service";

const expenseService = new ExpenseService();
export async function GET(request: Request,
    {params} : { params: Promise<{ userId: string }> }
) {
    try{ 
        const userId = (await params).userId;

        if (!userId) {
            return new Response(JSON.stringify({ message: 'Missing userId' }), { status: 400 });
        }

        const expenses = await expenseService.getReportByUser(userId);

        if (!expenses) {
            return new Response(JSON.stringify({ message: 'No expenses found for this user' }), { status: 404 });
        }

        return new Response(JSON.stringify({
            success: true,
            data: expenses,
            message: 'Report generated successfully'
        }), { status: 200 });
    } catch (error) {
        console.error("Error in GET request:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}