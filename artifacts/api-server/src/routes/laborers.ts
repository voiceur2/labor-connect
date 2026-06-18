import { Router, type IRouter } from "express";
import { eq, ilike, or, sql } from "drizzle-orm";
import { db, laborersTable } from "@workspace/db";
import {
  ListLaborersQueryParams,
  ListLaborersResponse,
  CreateLaborerBody,
  GetLaborerParams,
  GetLaborerResponse,
  UpdateLaborerParams,
  UpdateLaborerBody,
  UpdateLaborerResponse,
  DeleteLaborerParams,
  DeleteLaborerQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WORK_TYPES = [
  "Bricklifter",
  "Loader / Unloader",
  "Construction Worker",
  "Painter",
  "Plumber",
  "Electrician Helper",
  "Carpenter Helper",
  "Gardener",
  "Cleaner",
  "Mover",
  "General Labor",
];

router.get("/work-types", async (_req, res): Promise<void> => {
  res.json(WORK_TYPES);
});

router.get("/laborers", async (req, res): Promise<void> => {
  const params = ListLaborersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { search, workType, location, lat, lng, radiusKm = 25 } = params.data;

  let laborers = await db.select().from(laborersTable);

  if (search) {
    const s = search.toLowerCase();
    laborers = laborers.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.location.toLowerCase().includes(s) ||
        l.workType.toLowerCase().includes(s)
    );
  }

  if (workType) {
    laborers = laborers.filter((l) =>
      l.workType.toLowerCase().includes(workType.toLowerCase())
    );
  }

  if (location) {
    laborers = laborers.filter((l) =>
      l.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  let withDistance = laborers.map((l) => ({ ...l, distanceKm: null as number | null }));

  if (lat != null && lng != null) {
    withDistance = withDistance
      .map((l) => {
        if (l.lat == null || l.lng == null) return { ...l, distanceKm: null };
        const R = 6371;
        const dLat = ((l.lat - lat) * Math.PI) / 180;
        const dLng = ((l.lng - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((l.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...l, distanceKm: Math.round(dist * 10) / 10 };
      })
      .filter((l) => l.distanceKm == null || l.distanceKm <= radiusKm)
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  const result = withDistance.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  res.json(ListLaborersResponse.parse(result));
});

router.post("/laborers", async (req, res): Promise<void> => {
  const parsed = CreateLaborerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [laborer] = await db.insert(laborersTable).values(parsed.data).returning();
  res.status(201).json(
    GetLaborerResponse.parse({ ...laborer, distanceKm: null, createdAt: laborer.createdAt.toISOString() })
  );
});

router.get("/laborers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetLaborerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [laborer] = await db.select().from(laborersTable).where(eq(laborersTable.id, params.data.id));
  if (!laborer) {
    res.status(404).json({ error: "Laborer not found" });
    return;
  }

  res.json(
    GetLaborerResponse.parse({ ...laborer, distanceKm: null, createdAt: laborer.createdAt.toISOString() })
  );
});

router.patch("/laborers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateLaborerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLaborerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [laborer] = await db
    .update(laborersTable)
    .set(parsed.data)
    .where(eq(laborersTable.id, params.data.id))
    .returning();

  if (!laborer) {
    res.status(404).json({ error: "Laborer not found" });
    return;
  }

  res.json(
    UpdateLaborerResponse.parse({ ...laborer, distanceKm: null, createdAt: laborer.createdAt.toISOString() })
  );
});

router.delete("/laborers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteLaborerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const phoneParam = DeleteLaborerQueryParams.safeParse(req.query);
  if (!phoneParam.success || !phoneParam.data.phone) {
    res.status(400).json({ error: "Phone number is required to delete a registration" });
    return;
  }

  const [existing] = await db.select().from(laborersTable).where(eq(laborersTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Laborer not found" });
    return;
  }

  if (existing.phone.trim() !== phoneParam.data.phone.trim()) {
    res.status(403).json({ error: "Phone number does not match. Only the registered laborer can remove their listing." });
    return;
  }

  await db.delete(laborersTable).where(eq(laborersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
