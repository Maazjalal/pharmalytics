import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

async function nextClientCode(): Promise<string> {
  const count = await prisma.client.count();
  return `CLT-${String(count + 1).padStart(4, "0")}`;
}

router.get("/", async (_req, res) => {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(clients);
});

const createSchema = z.object({
  name: z.string().min(1),
});

router.post("/", async (req, res) => {
  const { name } = createSchema.parse(req.body);

  const client = await prisma.client.create({
    data: {
      name,
      clientCode: await nextClientCode(),
      createdBy: req.user!.userId,
    },
  });

  res.status(201).json(client);
});

router.get("/:id", async (req, res) => {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      clientMedications: {
        include: { medication: true },
        orderBy: { dateAdded: "desc" },
      },
    },
  });

  const total = client.clientMedications.reduce((sum, cm) => sum + Number(cm.price), 0);

  res.json({ ...client, total });
});

const statusSchema = z.object({
  status: z.enum(["paid", "due"]),
});

router.patch("/:id/status", async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(client);
});

router.delete("/:id", async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

const addMedicationSchema = z.object({
  medicationId: z.string().uuid(),
  dosage: z.number().positive(),
  dosageUnit: z.string().min(1),
  prescriptionDate: z.coerce.date(),
  price: z.number().positive().optional(),
});

router.post("/:id/medications", async (req, res) => {
  const data = addMedicationSchema.parse(req.body);

  const medication = await prisma.medication.findUniqueOrThrow({
    where: { id: data.medicationId },
  });

  const clientMedication = await prisma.clientMedication.create({
    data: {
      clientId: req.params.id,
      medicationId: data.medicationId,
      dosage: data.dosage,
      dosageUnit: data.dosageUnit,
      prescriptionDate: data.prescriptionDate,
      price: data.price ?? medication.defaultPrice,
    },
    include: { medication: true },
  });

  res.status(201).json(clientMedication);
});

export default router;
