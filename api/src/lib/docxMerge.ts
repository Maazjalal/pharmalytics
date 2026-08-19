import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export class TemplateRenderError extends Error {}

export function fillTemplate(templateBuffer: Buffer, data: Record<string, unknown>): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "[", end: "]" },
  });

  try {
    doc.render(data);
  } catch (err) {
    const detail =
      err && typeof err === "object" && "properties" in err
        ? JSON.stringify((err as { properties: unknown }).properties)
        : String(err);
    throw new TemplateRenderError(`Could not fill the PDF template: ${detail}`);
  }

  return doc.getZip().generate({ type: "nodebuffer" });
}
