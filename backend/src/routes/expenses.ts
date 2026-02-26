import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { upload } from '../middleware/upload';
import { uploadToCdn } from '../utils/cdn';
import { createExpenseSchema, updateExpenseSchema, EXPENSE_CATEGORIES } from '../utils/validation';

const router = Router();

type IdParam = { id: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  return { start: new Date(year!, mon! - 1, 1), end: new Date(year!, mon!, 1) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// ── GET all expenses (optional ?month=YYYY-MM) ────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    let where = {};
    if (month && typeof month === 'string') {
      const { start, end } = getMonthRange(month);
      where = { date: { gte: start, lt: end } };
    }
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ── GET stats ?month=YYYY-MM ──────────────────────────────────────────────────

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    let where = {};
    if (month && typeof month === 'string') {
      const { start, end } = getMonthRange(month);
      where = { date: { gte: start, lt: end } };
    }
    const expenses = await prisma.expense.findMany({ where });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, { total: number; count: number }>>((acc, cat) => {
      const items = expenses.filter((e) => e.category === cat);
      acc[cat] = { total: items.reduce((s, e) => s + e.amount, 0), count: items.length };
      return acc;
    }, {});
    res.json({ total, byCategory, count: expenses.length, month: month ?? null });
  } catch {
    res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
});

// ── GET daily-stats ?month=YYYY-MM ────────────────────────────────────────────

router.get('/daily-stats', async (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : null;
    const targetMonth = month ?? (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const { start, end } = getMonthRange(targetMonth);
    const [year, mon] = targetMonth.split('-').map(Number);
    const numDays = daysInMonth(year!, mon!);

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: start, lt: end } },
    });

    const days = Array.from({ length: numDays }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const dateStr = `${targetMonth}-${day}`;
      const dayExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === mon! - 1 && d.getDate() === i + 1;
      });
      const byCategory: Record<string, number> = {};
      for (const e of dayExpenses) {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
      }
      return {
        date: dateStr,
        total: dayExpenses.reduce((s, e) => s + e.amount, 0),
        byCategory,
      };
    });

    res.json({ month: targetMonth, days });
  } catch {
    res.status(500).json({ error: 'Failed to fetch daily stats' });
  }
});

// ── GET budget limits ─────────────────────────────────────────────────────────

router.get('/limits', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: 'budget_limit__' } },
    });
    const limits: Record<string, number | null> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const s = settings.find((x) => x.key === `budget_limit__${cat}`);
      limits[cat] = s && s.value ? parseFloat(s.value) : null;
    }
    res.json(limits);
  } catch {
    res.status(500).json({ error: 'Failed to fetch budget limits' });
  }
});

// ── PUT budget limits ─────────────────────────────────────────────────────────

router.put('/limits', async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, number | null>;
    await Promise.all(
      Object.entries(body).map(([cat, value]) => {
        if (!EXPENSE_CATEGORIES.includes(cat as any)) return;
        const key = `budget_limit__${cat}`;
        if (value === null || value === 0) {
          return prisma.appSetting.deleteMany({ where: { key } });
        }
        return prisma.appSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      })
    );
    // Return updated limits
    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: 'budget_limit__' } },
    });
    const limits: Record<string, number | null> = {};
    for (const cat of EXPENSE_CATEGORIES) {
      const s = settings.find((x) => x.key === `budget_limit__${cat}`);
      limits[cat] = s && s.value ? parseFloat(s.value) : null;
    }
    res.json(limits);
  } catch {
    res.status(500).json({ error: 'Failed to update budget limits' });
  }
});

// ── POST upload receipt ───────────────────────────────────────────────────────

router.post('/upload-receipt', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: 'No photo uploaded' }); return; }
    const { url } = await uploadToCdn(file.buffer, file.originalname);
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload receipt' });
  }
});

// ── GET single expense ────────────────────────────────────────────────────────

router.get('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
    if (!expense) { res.status(404).json({ error: 'Expense not found' }); return; }
    res.json(expense);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// ── POST create expense ───────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createExpenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error: any) {
    console.error('Create expense error:', error);
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// ── PUT update expense ────────────────────────────────────────────────────────

router.put('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    const data = updateExpenseSchema.parse(req.body);
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data });
    res.json(expense);
  } catch (error: any) {
    console.error('Update expense error:', error);
    if (error.name === 'ZodError') { res.status(400).json({ error: error.errors }); return; }
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// ── DELETE expense ────────────────────────────────────────────────────────────

router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'Expense deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export { router as expenseRoutes };
