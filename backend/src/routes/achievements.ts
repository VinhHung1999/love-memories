import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// ─── Achievement definitions (hardcoded, DB only tracks unlocked) ─────────────

export const ACHIEVEMENT_DEFS = [
  { key: 'first_moment',   title: 'Kỷ niệm đầu tiên',          description: 'Tạo moment đầu tiên',               icon: '📸', category: 'moments'   },
  { key: 'moments_10',     title: '10 kỷ niệm',                 description: 'Tạo 10 moments',                    icon: '🎞️', category: 'moments'   },
  { key: 'moments_50',     title: '50 kỷ niệm',                 description: 'Tạo 50 moments',                    icon: '🏆', category: 'moments'   },
  { key: 'first_cook',     title: 'Bữa đầu tiên',               description: 'Hoàn thành phiên nấu ăn đầu tiên', icon: '🍳', category: 'cooking'   },
  { key: 'cook_5',         title: 'Đầu bếp tập sự',             description: 'Nấu 5 bữa cùng nhau',              icon: '👨‍🍳', category: 'cooking'   },
  { key: 'cook_10',        title: 'Đầu bếp chuyên nghiệp',      description: 'Nấu 10 bữa cùng nhau',             icon: '⭐', category: 'cooking'   },
  { key: 'first_recipe',   title: 'Công thức đầu tiên',         description: 'Thêm công thức đầu tiên',           icon: '📝', category: 'recipes'   },
  { key: 'recipes_10',     title: 'Sưu tầm 10 công thức',       description: 'Có 10 công thức',                   icon: '📚', category: 'recipes'   },
  { key: 'ai_recipe',      title: 'Đầu bếp AI',                 description: 'Tạo công thức bằng AI',             icon: '🤖', category: 'recipes'   },
  { key: 'first_foodspot', title: 'Quán đầu tiên',              description: 'Thêm food spot đầu tiên',           icon: '📍', category: 'foodspots' },
  { key: 'foodspots_10',   title: 'Sành ăn',                    description: 'Khám phá 10 quán',                  icon: '🍜', category: 'foodspots' },
  { key: 'first_sprint',   title: 'Sprint đầu tiên',            description: 'Hoàn thành sprint đầu tiên',        icon: '🎯', category: 'goals'     },
  { key: 'goals_10',       title: '10 Goals Done',              description: 'Hoàn thành 10 goals',               icon: '✅', category: 'goals'     },
] as const;

// GET /api/achievements
// Evaluates conditions, auto-unlocks newly met achievements, returns all with status.
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [momentCount, recipeCount, foodSpotCount, completedSessionCount, completedSprintCount, doneGoalCount, aiRecipeSetting] =
      await Promise.all([
        prisma.moment.count(),
        prisma.recipe.count(),
        prisma.foodSpot.count(),
        prisma.cookingSession.count({ where: { status: 'completed' } }),
        prisma.sprint.count({ where: { status: 'COMPLETED' } }),
        prisma.goal.count({ where: { status: 'DONE' } }),
        prisma.appSetting.findUnique({ where: { key: 'ai_recipe_created' } }),
      ]);

    const conditionMet: Record<string, boolean> = {
      first_moment:   momentCount >= 1,
      moments_10:     momentCount >= 10,
      moments_50:     momentCount >= 50,
      first_cook:     completedSessionCount >= 1,
      cook_5:         completedSessionCount >= 5,
      cook_10:        completedSessionCount >= 10,
      first_recipe:   recipeCount >= 1,
      recipes_10:     recipeCount >= 10,
      ai_recipe:      aiRecipeSetting?.value === 'true',
      first_foodspot: foodSpotCount >= 1,
      foodspots_10:   foodSpotCount >= 10,
      first_sprint:   completedSprintCount >= 1,
      goals_10:       doneGoalCount >= 10,
    };

    // Load already-unlocked keys
    const existing = await prisma.achievement.findMany();
    const unlockedKeys = new Set(existing.map((a) => a.key));

    // Auto-unlock newly met achievements
    const newKeys = ACHIEVEMENT_DEFS
      .map((d) => d.key)
      .filter((k) => conditionMet[k] && !unlockedKeys.has(k));

    if (newKeys.length > 0) {
      await prisma.achievement.createMany({
        data: newKeys.map((key) => ({ key })),
        skipDuplicates: true,
      });
    }

    // Final state
    const finalUnlocked = await prisma.achievement.findMany();
    const unlockedMap = new Map(finalUnlocked.map((a) => [a.key, a]));

    const result = ACHIEVEMENT_DEFS.map((def) => {
      const record = unlockedMap.get(def.key);
      return {
        key: def.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        unlocked: !!record,
        unlockedAt: record?.unlockedAt ?? null,
      };
    });

    res.json(result);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

export { router as achievementRoutes };
