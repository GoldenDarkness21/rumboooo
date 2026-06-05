import { supabase } from './client';
import type { Expense, ExpenseSplit, SplitMethod, ExpenseCategory } from '@/types';

export interface CreateExpenseParams {
  tripId: string;
  paidById: string;
  description: string;
  amount: number;
  currency: string;
  splitMethod: SplitMethod;
  splits: Omit<ExpenseSplit, 'id'>[];
  date: string;
  category: ExpenseCategory;
  notes?: string;
}

export interface UpdateExpenseParams {
  paidById?: string;
  description?: string;
  amount?: number;
  currency?: string;
  splitMethod?: SplitMethod;
  splits?: Omit<ExpenseSplit, 'id'>[];
  date?: string;
  category?: ExpenseCategory;
  notes?: string;
}

export const expensesService = {
  /**
   * Obtener todos los gastos de un viaje
   */
  async getExpensesByTrip(tripId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        splits:expense_splits (
          participant_id,
          amount,
          percentage
        )
      `)
      .eq('trip_id', tripId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(exp => ({
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      paidById: exp.paid_by_id,
      splitMethod: exp.split_method as SplitMethod,
      splits: (exp.splits || []) as ExpenseSplit[],
      date: exp.date,
      category: exp.category as ExpenseCategory,
      notes: exp.notes || undefined,
    }));
  },

  /**
   * Obtener un gasto específico
   */
  async getExpense(expenseId: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        splits:expense_splits (
          participant_id,
          amount,
          percentage
        )
      `)
      .eq('id', expenseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      paidById: data.paid_by_id,
      splitMethod: data.split_method as SplitMethod,
      splits: (data.splits || []) as ExpenseSplit[],
      date: data.date,
      category: data.category as ExpenseCategory,
      notes: data.notes || undefined,
    };
  },

  /**
   * Crear un nuevo gasto
   */
  async createExpense({
    tripId,
    paidById,
    description,
    amount,
    currency,
    splitMethod,
    splits,
    date,
    category,
    notes,
  }: CreateExpenseParams): Promise<Expense> {
    // Crear el gasto
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        paid_by_id: paidById,
        description,
        amount,
        currency,
        split_method: splitMethod,
        date,
        category,
        notes,
      })
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Crear los splits
    if (splits.length > 0) {
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(
          splits.map(s => ({
            expense_id: expense.id,
            participant_id: s.participantId,
            amount: s.amount,
            percentage: s.percentage,
          }))
        );

      if (splitsError) throw splitsError;
    }

    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      paidById: expense.paid_by_id,
      splitMethod: expense.split_method as SplitMethod,
      splits: splits as ExpenseSplit[],
      date: expense.date,
      category: expense.category as ExpenseCategory,
      notes: expense.notes || undefined,
    };
  },

  /**
   * Actualizar un gasto
   */
  async updateExpense(expenseId: string, params: UpdateExpenseParams): Promise<Expense> {
    // Actualizar el gasto
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .update({
        paid_by_id: params.paidById,
        description: params.description,
        amount: params.amount,
        currency: params.currency,
        split_method: params.splitMethod,
        date: params.date,
        category: params.category,
        notes: params.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (expenseError) throw expenseError;

    // Si hay splits nuevos, eliminar los antiguos y crear los nuevos
    if (params.splits) {
      // Eliminar splits antiguos
      const { error: deleteError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expenseId);

      if (deleteError) throw deleteError;

      // Crear nuevos splits
      if (params.splits.length > 0) {
        const { error: insertError } = await supabase
          .from('expense_splits')
          .insert(
            params.splits.map(s => ({
              expense_id: expenseId,
              participant_id: s.participantId,
              amount: s.amount,
              percentage: s.percentage,
            }))
          );

        if (insertError) throw insertError;
      }
    }

    // Obtener el gasto actualizado con sus splits
    return (await expensesService.getExpense(expenseId))!;
  },

  /**
   * Eliminar un gasto
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },
};