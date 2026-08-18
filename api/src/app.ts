import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import medicationsRoutes from "./routes/medications.routes.js";
import clientMedicationsRoutes from "./routes/clientMedications.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/clients", requireAuth, clientsRoutes);
app.use("/api/medications", requireAuth, medicationsRoutes);
app.use("/api/client-medications", requireAuth, clientMedicationsRoutes);

app.use(errorHandler);
