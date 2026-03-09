import prisma from '../utils/prisma';
import { uploadToCdn } from '../utils/cdn';
import { AppError } from '../types/errors';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../validators/expenseSchemas';
import type { z } from 'zod';
import type { createExpenseSchema, updateExpenseSchema } from '../validators/expenseSchemas';

type CreateData = z.infer<typeof createExpenseSchema>;
type UpdateData = z.infer<typeof updateExpenseSchema>;

interface ListFilters {
  month?: string;
  datePlanId?: string;
}

function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split('-').map(Number);
  return { start: new Date(year!, mon! - 1, 1), end: new Date(year!, mon!, 1) };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export async function list(coupleId: string, filters: ListFilters) {
  let where: Record<string, unknown> = { coupleId };
  if (filters.month) {
    const { start, end } = getMonthRange(filters.month);
    where = { ...where, date: { gte: start, lt: end } };
  }
  if (filters.datePlanId) {
    where = { ...where, datePlanId: filters.datePlanId };
  }
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
}

export async function stats(coupleId: string, month?: string) {
  let where: Record<string, unknown> = { coupleId };
  if (month) {
    const { start, end } = getMonthRange(month);
    where = { ...where, date: { gte: start, lt: end } };
  }
  const expenses = await prisma.expense.findMany({ where });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.reduce<Record<string, { total: number; count: number }>>((acc, cat) => {
    const items = expenses.filter((e) => e.category === cat);
    acc[cat] = { total: items.reduce((s, e) => s + e.amount, 0), count: items.length };
    return acc;
  }, {});
  return { total, byCategory, count: expenses.length, month: month ?? null };
}

export async function dailyStats(coupleId: string, month?: string) {
  const targetMonth = month ?? (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const { start, end } = getMonthRange(targetMonth);
  const [year, mon] = targetMonth.split('-').map(Number);
  const numDays = daysInMonth(year!, mon!);

  const expenses = await prisma.expense.findMany({
    where: { coupleId, date: { gte: start, lt: end } },
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
    return { date: dateStr, total: dayExpenses.reduce((s, e) => s + e.amount, 0), byCategory };
  });

  return { month: targetMonth, days };
}

export async function getLimits(coupleId: string) {
  const settings = await prisma.appSetting.findMany({
    where: { coupleId, key: { startsWith: 'budget_limit__' } },
  });
  const limits: Record<string, number | null> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    const s = settings.find((x) => x.key === `budget_limit__${cat}`);
    limits[cat] = s && s.value ? parseFloat(s.value) : null;
  }
  return limits;
}

export async function setLimits(coupleId: string, body: Record<string, number | null>) {
  await Promise.all(
    Object.entries(body).map(([cat, value]) => {
      if (!EXPENSE_CATEGORIES.includes(cat as ExpenseCategory)) return;
      const key = `budget_limit__${cat}`;
      if (value === null || value === 0) {
        return prisma.appSetting.deleteMany({ where: { key, coupleId } });
      }
      return prisma.appSetting.upsert({
        where: { key_coupleId: { key, coupleId } },
        update: { value: String(value) },
        create: { key, value: String(value), coupleId },
      });
    })
  );
  return getLimits(coupleId);
}

export async function uploadReceipt(file: Express.Multer.File) {
  const { url } = await uploadToCdn(file.buffer, file.originalname, file.mimetype);
  return { url };
}

export async function getOne(id: string, coupleId: string) {
  const expense = await prisma.expense.findFirst({ where: { id, coupleId } });
  if (!expense) throw new AppError(404, 'Expense not found');
  return expense;
}

export async function create(coupleId: string, data: CreateData) {
  return prisma.expense.create({ data: { ...data, coupleId } });
}

export async function update(id: string, coupleId: string, data: UpdateData) {
  const existing = await prisma.expense.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Expense not found');
  return prisma.expense.update({ where: { id }, data });
}

export async function remove(id: string, coupleId: string) {
  const existing = await prisma.expense.findFirst({ where: { id, coupleId } });
  if (!existing) throw new AppError(404, 'Expense not found');
  await prisma.expense.delete({ where: { id } });
}
