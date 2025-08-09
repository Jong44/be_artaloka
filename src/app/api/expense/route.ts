import { ExpenseService } from "@/services/expense_service";
import { Expense } from "@/types/expense";

const expenseService = new ExpenseService();


export async function POST(request: Request) {
    try {
        const { expense }: {
            expense: Expense
        } = await request.json();

        if (!expense) {
            return new Response(JSON.stringify({ message: 'Expense data is required' }), { status: 400 });
        }


        // Handle batch save
        if (expense.receipts && Array.isArray(expense.receipts)) {
            // Simpan satu per satu
            const savedIds: string[] = [];

            expense.receipts = expense.receipts.map(receipt => ({
                ...receipt,
                user_id: expense.user_id, // Ensure user_id is set for each receipt
            }));
            if (expense.receipts.length === 0) {
                return new Response(JSON.stringify({ message: 'No receipts to save' }), { status: 400 });
            }

            for (const e of expense.receipts) {
                const id = await expenseService.saveExpense(e);
                savedIds.push(id);
            }

            return new Response(JSON.stringify({
                success: true,
                expenseIds: savedIds,
            }), { status: 201 });
        }

        // Single save
        if (!expense.user_id) {
            return new Response(JSON.stringify({ message: 'user_id is required' }), { status: 400 });
        }

        const expenseId = await expenseService.saveExpense(expense);

        return new Response(JSON.stringify({
            success: true,
            expenseId,
        }), { status: 201 });

    } catch (error) {
        console.error("Error in POST request:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
