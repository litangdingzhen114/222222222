CREATE TABLE "IntegrationConfig" (
  "id" TEXT NOT NULL,
  "service" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT,
  "isSecret" BOOLEAN NOT NULL DEFAULT true,
  "valuePreview" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConfig_service_key_key" ON "IntegrationConfig"("service", "key");
CREATE INDEX "IntegrationConfig_service_idx" ON "IntegrationConfig"("service");
CREATE INDEX "IntegrationConfig_updatedById_idx" ON "IntegrationConfig"("updatedById");

ALTER TABLE "IntegrationConfig"
ADD CONSTRAINT "IntegrationConfig_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
