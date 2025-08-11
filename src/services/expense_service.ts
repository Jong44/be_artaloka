import { supabase } from "@/lib/supabase_client";
import { Expense } from "@/types/expense";

export class ExpenseService {
  // Add methods for handling expenses
  async saveExpense(expense: Expense): Promise<string> {
    try {
      // Insert expense
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          code_receipt: expense.code_receipt,
          name_store: expense.name_store,
          note: expense.note,
          date: expense.date,
          total_price: expense.total_price,
          tax_price: expense.tax_price,
          category: expense.category,
          id_user: expense.user_id,
          category_budget: expense.category_budget,
        })
        .select('id_expense')
        .single();

      if (expenseError) throw expenseError;

      // Insert expense details
      const detailsToInsert = expense.details.map(detail => ({
        ...detail,
        id_expense: expenseData.id_expense,
      }));

      const { error: detailsError } = await supabase
        .from('expense_details')
        .insert(detailsToInsert);

      if (detailsError) throw detailsError;

      return expenseData.id_expense;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database save failed: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred while saving expenses');
      }
    }
  }

  async getExpensesByUser(userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
        *,
        expense_details (*)
      `)
        .eq('id_user', userId);

      if (error) throw error;

      return data as Expense[];
    }
    catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database fetch failed: ${error.message}`);
      } else {
        throw new Error('An unknown error occurred while fetching expenses');
      }
    }
  }

  async getReportByUser(userId: string) {
    // return total expenses this month, this week, this day, and this year
    // and return total expenses per category
    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_details (*)
        `)
        .eq('id_user', userId);

      if (error) throw error;

      let category:any = [];
      data.forEach(expense => {
        const categoryName = expense.category || 'Uncategorized';
        const existingCategory = category.find((cat: any) => cat.name === categoryName);
        if (existingCategory) {
          existingCategory.total += expense.total_price;
        } else {
          category.push({
            name: categoryName,
            total: expense.total_price
          });
        }
      });

      return {
        totalExpensesByCategory: category,
        totalExpensesByCategoryBudget: data.reduce((acc, expense) => {
          const category = expense.category_budget || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = 0;
          }
          acc[category] += expense.total_price;
          return acc;
        }, {}),
        totalExpenses: data.reduce((sum, expense) => sum + expense.total_price, 0),
        expensesThisMonth: {
          "total_expenses": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
          }).reduce((sum, expense) => sum + expense.total_price, 0),
          "total": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
          }).length,
          "weeks": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
          }).reduce((acc, expense) => {
            const weekNumber = Math.floor((new Date(expense.date).getTime() - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()) / (1000 * 60 * 60 * 24 * 7));
            // return total expenses per week
            acc[weekNumber] = (acc[weekNumber + '_total'] || 0) + expense.total_price;
            return acc;
          }, {})
        },
        expensesThisWeek: {
          "total_expenses": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            return expenseDate >= oneWeekAgo && expenseDate <= today;
          }).reduce((sum, expense) => sum + expense.total_price, 0),
          "total": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            const oneWeekAgo = new Date(today);
            oneWeekAgo.setDate(today.getDate() - 7);
            return expenseDate >= oneWeekAgo && expenseDate <= today;
          }).length,
          "days": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getFullYear() === today.getFullYear() && expenseDate.getMonth() === today.getMonth() && expenseDate.getDate() >= today.getDate() - 6;
          }
        ).reduce((acc, expense) => {
            const day = new Date(expense.date).getDate();
            acc[day] = (acc[day] || 0) + expense.total_price;
            return acc;
          }, {})
        },
        expensesToday: data.filter(expense => {
          const expenseDate = new Date(expense.date);
          const today = new Date();
          return expenseDate.toDateString() === today.toDateString();
        }).length,
        expensesThisYear: {
          "total_expenses": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getFullYear() === today.getFullYear();
          }).reduce((sum, expense) => sum + expense.total_price, 0),
          "total": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getFullYear() === today.getFullYear();
          }).length,
          "months": data.filter(expense => {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            return expenseDate.getFullYear() === today.getFullYear();
          }).reduce((acc, expense) => {
            const month = new Date(expense.date).getMonth();
            acc[month] = (acc[month] || 0) + expense.total_price;
            return acc;
          }, {})
      }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Database fetch failed: ${error.message}`);
      }
    }
  }
}