import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const medications = await prisma.medication.findMany({ orderBy: { name: "asc" } });
  res.json(medications);
});

const createSchema = z.object({
  name: z.string().min(1),
  defaultPrice: z.number().positive(),
});

router.post("/", async (req, res) => {
  const data = createSchema.parse(req.body);
  const medication = await prisma.medication.create({ data });
  res.status(201).json(medication);
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  defaultPrice: z.number().positive().optional(),
});

router.patch("/:id", async (req, res) => {
  const data = updateSchema.parse(req.body);
  const medication = await prisma.medication.update({
    where: { id: req.params.id },
    data,
  });
  res.json(medication);
});

export default router;
