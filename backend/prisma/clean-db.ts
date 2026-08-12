import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const confirmed = process.argv.includes('--confirm');

  if (!confirmed) {
    console.log('');
    console.log('⚠️  Este script borra TODAS las ventas y resúmenes del dashboard.');
    console.log('   NO toca usuarios, productos ni categorías.');
    console.log('');
    console.log('   Para ejecutarlo, usa:');
    console.log('   npm run clean-db -- --confirm');
    console.log('');
    process.exit(0);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ No se encontró DATABASE_URL.');
    console.error('   Verifica que backend/.env exista y tenga la URL de Render.');
    process.exit(1);
  }

  console.log('');
  console.log('🧹 Limpiando registros de prueba...');
  console.log('');

  const [orders, orderItems, summaries] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.dailySummary.count(),
  ]);

  console.log('📊 Registros actuales:');
  console.log(`   Ventas (orders):        ${orders}`);
  console.log(`   Detalle (order_items):  ${orderItems}`);
  console.log(`   Resúmenes diarios:      ${summaries}`);
  console.log('');

  if (orders === 0 && summaries === 0) {
    console.log('✅ La base de datos ya está limpia. No hay nada que borrar.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    const deletedSummaries = await tx.dailySummary.deleteMany();
    const deletedOrders = await tx.order.deleteMany();

    await tx.$executeRaw`ALTER SEQUENCE orders_id_seq RESTART WITH 1`;
    await tx.$executeRaw`ALTER SEQUENCE order_items_id_seq RESTART WITH 1`;
    await tx.$executeRaw`ALTER SEQUENCE daily_summaries_id_seq RESTART WITH 1`;

    console.log(`🗑️  Resúmenes eliminados:  ${deletedSummaries.count}`);
    console.log(`🗑️  Ventas eliminadas:     ${deletedOrders.count}`);
  });

  const [users, products, categories] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
  ]);

  console.log('');
  console.log('✅ Limpieza completada. Datos conservados:');
  console.log(`   Usuarios:    ${users}`);
  console.log(`   Productos:   ${products}`);
  console.log(`   Categorías:  ${categories}`);
  console.log('');
  console.log('💡 Recuerda cambiar las contraseñas por defecto desde el módulo Usuarios.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error al limpiar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
