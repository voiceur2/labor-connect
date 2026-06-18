import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, laborersTable } from "@workspace/db";
import { GetStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(laborersTable);
  const totalLaborers = all.length;
  const availableLaborers = all.filter((l) => l.isAvailable).length;

  const workTypeCounts: Record<string, number> = {};
  for (const laborer of all) {
    workTypeCounts[laborer.workType] = (workTypeCounts[laborer.workType] ?? 0) + 1;
  }

  const topWorkTypes = Object.entries(workTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([workType, count]) => ({ workType, count }));

  const totalWorkTypes = Object.keys(workTypeCounts).length;

  res.json(
    GetStatsResponse.parse({
      totalLaborers,
      availableLaborers,
      totalWorkTypes,
      topWorkTypes,
    })
  );
});

export default router;
