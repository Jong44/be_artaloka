export interface ExpenseDetail {
  name_product: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
}

export interface Expense {
  code_receipt: string;
  name_store: string;
  note?: string;
  date: string;
  total_price: number;
  tax_price: number;
  category: string;
  category_budget?: "needs" | "wants" | "savings";
  user_id: string;
  details: ExpenseDetail[];
  receipts?: Expense[];
}

export interface OCRResult {
  text: string;
  confidence: number;
}