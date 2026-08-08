// Script para resolver migración fallida y aplicar nueva migración
const { execSync } = require('child_process');

console.log('🔧 Resolviendo migración fallida...');

try {
  // Marcar la migración fallida como aplicada
  execSync(
    'npx prisma migrate resolve --applied 20260320190723_add_must_change_password',
    { stdio: 'inherit', cwd: __dirname }
  );
  console.log('✅ Migración fallida marcada como resuelta');

  // Ahora aplicar las nuevas migraciones
  console.log('\n🚀 Aplicando nuevas migraciones...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Migraciones aplicadas correctamente');

  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
