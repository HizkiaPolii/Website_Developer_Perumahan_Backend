-- CreateTable
CREATE TABLE "balance_sheet_items" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL,
    "parentId" INTEGER,
    "isParent" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balance_sheet_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "balance_sheet_items_reportId_idx" ON "balance_sheet_items"("reportId");

-- AddForeignKey
ALTER TABLE "balance_sheet_items" ADD CONSTRAINT "balance_sheet_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "financial_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_sheet_items" ADD CONSTRAINT "balance_sheet_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "balance_sheet_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
