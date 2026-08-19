import fs from "node:fs/promises";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { attachmentPath, uploadAttachment } from "../lib/uploads.js";

const router = Router();

async function nextClientCode(): Promise<string> {
  const count = await prisma.client.count();
  return `CLT-${String(count + 1).padStart(4, "0")}`;
}

const listQuerySchema = z.object({
  archived: z.enum(["true", "false"]).optional(),
  search: z.string().trim().min(1).optional(),
});

router.get("/", async (req, res) => {
  const { archived, search } = listQuerySchema.parse(req.query);

  const clients = await prisma.client.findMany({
    where: {
      ...(archived !== undefined && { archived: archived === "true" }),
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    },
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
  status: z.enum(["treatment", "settled"]),
});

router.patch("/:id/status", async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(client);
});

const archiveSchema = z.object({
  archived: z.boolean(),
});

router.patch("/:id/archive", async (req, res) => {
  const { archived } = archiveSchema.parse(req.body);
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: { archived },
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

router.post("/:id/attachment", uploadAttachment.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file provided" });
  }

  const clientId = String(req.params.id);
  const client = await prisma.client.findUniqueOrThrow({ where: { id: clientId } });

  await fs.writeFile(attachmentPath(client.id), req.file.buffer);

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      attachmentOriginalName: req.file.originalname,
      attachmentUploadedAt: new Date(),
    },
  });

  res.status(201).json(updated);
});

router.get("/:id/attachment", async (req, res) => {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: req.params.id } });

  if (!client.attachmentOriginalName) {
    return res.status(404).json({ error: "No attachment for this client" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${client.attachmentOriginalName.replace(/"/g, "")}"`,
  );
  res.sendFile(attachmentPath(client.id));
});

router.delete("/:id/attachment", async (req, res) => {
  const client = await prisma.client.findUniqueOrThrow({ where: { id: req.params.id } });

  await fs.rm(attachmentPath(client.id), { force: true });

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: { attachmentOriginalName: null, attachmentUploadedAt: null },
  });

  res.json(updated);
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
