-- AlterEnum
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLEADO', 'COCINA');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role" USING (
  CASE "role"::text
    WHEN 'CAJERO' THEN 'EMPLEADO'::"Role"
    ELSE "role"::text::"Role"
  END
);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLEADO';
DROP TYPE "Role_old";

-- AlterEnum
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTA', 'COMPLETADA', 'ANULADA');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING (
  CASE "status"::text
    WHEN 'PENDIENTE' THEN 'PENDIENTE'::"OrderStatus"
    WHEN 'COMPLETADA' THEN 'COMPLETADA'::"OrderStatus"
    WHEN 'ANULADA' THEN 'ANULADA'::"OrderStatus"
    ELSE 'PENDIENTE'::"OrderStatus"
  END
);
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';
DROP TYPE "OrderStatus_old";

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('PARA_LLEVAR', 'COMER_AQUI');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "serviceType" "ServiceType";
