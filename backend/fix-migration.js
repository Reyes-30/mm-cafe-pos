// Script para limpiar migraciones fallidas y aplicar nuevas
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Limpiando registros de migraciones fallidas...');
    
    // Eliminar registros de migraciones fallidas de la tabla _prisma_migrations
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20260320190723_add_must_change_password'
    `);
    
    console.log('✅ Registros de migraciones fallidas eliminados');
    
    await prisma.$disconnect();
    
    // Ahora aplicar las nuevas migraciones
    console.log('\n🚀 Aplicando migraciones...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Migraciones aplicadas correctamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
