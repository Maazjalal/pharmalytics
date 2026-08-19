-- CreateTable
CREATE TABLE "pdf_template" (
    "id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_template_pkey" PRIMARY KEY ("id")
);
