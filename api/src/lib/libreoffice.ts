import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function defaultSofficeBin(): string {
  if (process.env.LIBREOFFICE_BIN) return process.env.LIBREOFFICE_BIN;
  if (process.platform === "darwin") {
    return "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  }
  return "soffice";
}

const SOFFICE_BIN = defaultSofficeBin();

/**
 * Converts a .docx buffer to PDF by shelling out to LibreOffice headless.
 * Each call gets its own scratch dir + LibreOffice user profile so
 * concurrent conversions don't collide on a shared instance lock.
 */
export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const workDir = path.join(os.tmpdir(), `pharmalytics-pdf-${randomUUID()}`);
  await fs.mkdir(workDir, { recursive: true });

  try {
    const docxPath = path.join(workDir, "input.docx");
    await fs.writeFile(docxPath, docxBuffer);

    await execFileAsync(SOFFICE_BIN, [
      "--headless",
      "--norestore",
      `-env:UserInstallation=file://${workDir}/profile`,
      "--convert-to",
      "pdf",
      "--outdir",
      workDir,
      docxPath,
    ]);

    return await fs.readFile(path.join(workDir, "input.pdf"));
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
