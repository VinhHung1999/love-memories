import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { createExpenseSchema, updateExpenseSchema, EXPENSE_CATEGORIES } from '../utils/validation';

const router = Router();

type IdParam = { id: string };

// GET all expenses (with optional month filter ?month=YYYY-MM)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    let where = {};
    if (month && typeof month === 'string') {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      where = { date: { gte: start, lt: end } };
    }
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET stats ?month=YYYY-MM
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    let where = {};
    if (month && typeof month === 'string') {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 1);
      where = { date: { gte: start, lt: end } };
    }

    const expenses = await prisma.expense.findMany({ where });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, { total: number; count: number }>>((acc, cat) => {
      const items = expenses.filter((e) => e.category === cat);
      acc[cat] = {
        total: items.reduce((s, e) => s + e.amount, 0),
        count: items.length,
      };
      return acc;
    }, {});

    res.json({ total, byCategory, count: expenses.length, month: month ?? null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
});

// GET single expense
router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) { res.status(404).json({ error: 'Expense not found' }); return; }
    res.json(expense);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST create expense
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createExpenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT update expense
router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateExpenseSchema.parse(req.body);
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data,
    });
    res.json(expense);
  } catch (error: any) {
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE expense
router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export { router as expenseRoutes };
