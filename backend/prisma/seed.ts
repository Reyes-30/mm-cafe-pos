import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mmcafe.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@mmcafe.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Create empleado user
  const empleadoPassword = await bcrypt.hash('empleado123', 12);
  const empleado = await prisma.user.upsert({
    where: { email: 'empleado@mmcafe.com' },
    update: {},
    create: {
      name: 'Empleado Principal',
      email: 'empleado@mmcafe.com',
      password: empleadoPassword,
      role: 'EMPLEADO',
      isActive: true,
    },
  });

  // Create cocina user
  const cocinaPassword = await bcrypt.hash('cocina123', 12);
  const cocina = await prisma.user.upsert({
    where: { email: 'cocina@mmcafe.com' },
    update: {},
    create: {
      name: 'Personal de Cocina',
      email: 'cocina@mmcafe.com',
      password: cocinaPassword,
      role: 'COCINA',
      isActive: true,
    },
  });

  console.log('✅ Users created:', { 
    admin: admin.email, 
    empleado: empleado.email,
    cocina: cocina.email 
  });

  // Create categories
  const categoryNames = [
    'Hamburguesas',
    'Alitas',
    'Pollo Frito',
    'Cenas',
    'Barbacoas',
    'Pupusas',
    'Tacos',
    'Antojitos',
  ];

  const categories: Record<string, number> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }

  console.log('✅ Categories created');

  // Products seed data
  const productsData = [
    // Hamburguesas
    { name: 'Hamburguesa de res sencilla', price: 80, categoryId: categories['Hamburguesas'], description: 'Hamburguesa de res con ingredientes frescos' },
    { name: 'Hamburguesa de res con papas', price: 120, categoryId: categories['Hamburguesas'], description: 'Hamburguesa de res acompañada de papas fritas' },
    { name: 'Hamburguesa doble carne', price: 165, categoryId: categories['Hamburguesas'], description: 'Doble porción de carne de res con todos los ingredientes' },
    { name: 'Hamburguesa de pollo sencilla', price: 70, categoryId: categories['Hamburguesas'], description: 'Hamburguesa de pollo con ingredientes frescos' },
    { name: 'Hamburguesa de pollo con papas', price: 110, categoryId: categories['Hamburguesas'], description: 'Hamburguesa de pollo acompañada de papas fritas' },
    { name: 'Hamburguesa de pollo BBQ con papas', price: 130, categoryId: categories['Hamburguesas'], description: 'Hamburguesa de pollo con salsa BBQ y papas fritas' },

    // Alitas
    { name: 'Alitas (6 unidades)', price: 170, categoryId: categories['Alitas'], description: '6 alitas de pollo con salsa a elegir' },
    { name: 'Alitas (8 unidades)', price: 215, categoryId: categories['Alitas'], description: '8 alitas de pollo con salsa a elegir' },
    { name: 'Alitas (10 unidades)', price: 290, categoryId: categories['Alitas'], description: '10 alitas de pollo con salsa a elegir' },
    { name: 'Alitas (12 unidades)', price: 360, categoryId: categories['Alitas'], description: '12 alitas de pollo con salsa a elegir' },

    // Pollo Frito
    { name: 'Pollo con papa', price: 100, categoryId: categories['Pollo Frito'], description: 'Pieza de pollo frito acompañada de papas' },
    { name: 'Deditos de pollo', price: 110, categoryId: categories['Pollo Frito'], description: 'Deditos de pollo crujientes' },
    { name: 'Pollo con tajadas (pequeño)', price: 80, categoryId: categories['Pollo Frito'], description: 'Pollo frito con tajadas de plátano - porción pequeña' },
    { name: 'Pollo con tajadas (mediano)', price: 90, categoryId: categories['Pollo Frito'], description: 'Pollo frito con tajadas de plátano - porción mediana' },
    { name: 'Pollo con tajadas (grande)', price: 100, categoryId: categories['Pollo Frito'], description: 'Pollo frito con tajadas de plátano - porción grande' },

    // Cenas
    { name: 'Cena con pollo', price: 100, categoryId: categories['Cenas'], description: 'Cena completa con pollo, acompañamientos incluidos' },
    { name: 'Cena con cerdo', price: 110, categoryId: categories['Cenas'], description: 'Cena completa con cerdo, acompañamientos incluidos' },
    { name: 'Cena con res', price: 120, categoryId: categories['Cenas'], description: 'Cena completa con res, acompañamientos incluidos' },

    // Barbacoas
    { name: 'Barbacoa de pollo', price: 100, categoryId: categories['Barbacoas'], description: 'Barbacoa de pollo con guarniciones' },
    { name: 'Barbacoa de cerdo', price: 110, categoryId: categories['Barbacoas'], description: 'Barbacoa de cerdo con guarniciones' },
    { name: 'Barbacoa de res', price: 130, categoryId: categories['Barbacoas'], description: 'Barbacoa de res con guarniciones' },

    // Pupusas
    { name: 'Pupusa de quesillo', price: 55, categoryId: categories['Pupusas'], description: 'Pupusa rellena de quesillo' },
    { name: 'Pupusa de chicharrón', price: 65, categoryId: categories['Pupusas'], description: 'Pupusa rellena de chicharrón' },
    { name: 'Pupusa de loroco', price: 70, categoryId: categories['Pupusas'], description: 'Pupusa rellena de loroco con quesillo' },

    // Tacos
    { name: 'Tacos de cerdo', price: 115, categoryId: categories['Tacos'], description: 'Tacos rellenos de cerdo con vegetales' },
    { name: 'Tacos de pollo', price: 110, categoryId: categories['Tacos'], description: 'Tacos rellenos de pollo con vegetales' },
    { name: 'Tacos de res', price: 130, categoryId: categories['Tacos'], description: 'Tacos rellenos de res con vegetales' },
    { name: 'Tacos de birria', price: 130, categoryId: categories['Tacos'], description: 'Tacos de birria con consomé' },
    { name: 'Flauta', price: 65, categoryId: categories['Tacos'], description: 'Flauta crujiente con relleno' },

    // Antojitos
    { name: 'Salchipapa pequeña', price: 85, categoryId: categories['Antojitos'], description: 'Salchicha con papas fritas - porción pequeña' },
    { name: 'Salchipapa grande', price: 140, categoryId: categories['Antojitos'], description: 'Salchicha con papas fritas - porción grande' },
    { name: 'Tortilla con quesillo', price: 50, categoryId: categories['Antojitos'], description: 'Tortilla de maíz con quesillo derretido' },
    { name: 'Catrachitas', price: 25, categoryId: categories['Antojitos'], description: 'Tortillas fritas con frijoles y queso' },
    { name: 'Chuleta con tajadas', price: 130, categoryId: categories['Antojitos'], description: 'Chuleta de cerdo acompañada de tajadas de plátano' },
  ];

  for (const product of productsData) {
    await prisma.product.upsert({
      where: { id: productsData.indexOf(product) + 1 },
      update: {},
      create: product,
    });
  }

  console.log(`✅ ${productsData.length} products created`);
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Default credentials:');
  console.log('   Admin: admin@mmcafe.com / admin123');
  console.log('   Empleado: empleado@mmcafe.com / empleado123');
  console.log('   Cocina: cocina@mmcafe.com / cocina123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
