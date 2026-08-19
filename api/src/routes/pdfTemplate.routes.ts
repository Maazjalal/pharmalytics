import fs from "node:fs/promises";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { TEMPLATE_PATH, uploadTemplate } from "../lib/pdfTemplate.js";

const router = Router();

router.get("/", async (_req, res) => {
  const template = await prisma.pdfTemplate.findFirst();
  res.json(template);
});

router.post("/", uploadTemplate.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No .docx file provided" });
  }

  await fs.writeFile(TEMPLATE_PATH, req.file.buffer);

  await prisma.pdfTemplate.deleteMany();
  const template = await prisma.pdfTemplate.create({
    data: { originalName: req.file.originalname },
  });

  res.status(201).json(template);
});

router.delete("/", async (_req, res) => {
  await fs.rm(TEMPLATE_PATH, { force: true });
  await prisma.pdfTemplate.deleteMany();
  res.status(204).end();
});

export default router;
