-- CreateTable
CREATE TABLE "income_statement_items" (
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

    CONSTRAINT "income_statement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "income_statement_items_reportId_idx" ON "income_statement_items"("reportId");

-- AddForeignKey
ALTER TABLE "income_statement_items" ADD CONSTRAINT "income_statement_items_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "financial_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_statement_items" ADD CONSTRAINT "income_statement_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "income_statement_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
