import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const updateSchema = z.object({
  dosage: z.number().positive().optional(),
  dosageUnit: z.string().min(1).optional(),
  prescriptionDate: z.coerce.date().optional(),
  price: z.number().positive().optional(),
});

router.patch("/:id", async (req, res) => {
  const data = updateSchema.parse(req.body);
  const clientMedication = await prisma.clientMedication.update({
    where: { id: req.params.id },
    data,
    include: { medication: true },
  });
  res.json(clientMedication);
});

router.delete("/:id", async (req, res) => {
  await prisma.clientMedication.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

export default router;
