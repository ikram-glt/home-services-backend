const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

async function main() {

  // ── Clients ────────────────────────────────────────────────
  const client1 = await prisma.user.create({
    data: {
      email:     'client1@test.com',
      nom:       'Ahmed Benali',
      telephone: '0612345678',
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email:     'client2@test.com',
      nom:       'Sara Mansouri',
      telephone: '0698765432',
    },
  });

  // ── Prestataires ───────────────────────────────────────────
  const presta1 = await prisma.prestataire.create({
    data: {
      email:       'presta1@test.com',
      nom:         'Karim Electricité',
      competences: 'Électricité / Électroménager',
      noteMoyenne: 4.5,
    },
  });

  const presta2 = await prisma.prestataire.create({
    data: {
      email:       'presta2@test.com',
      nom:         'Hassan Plomberie',
      competences: 'Plomberie',
      noteMoyenne: 4.2,
    },
  });

  // ── Services ───────────────────────────────────────────────
  const service1 = await prisma.service.create({
    data: {
      titre:       'Réparation électroménager',
      description: 'Réparation de tous appareils électroménagers',
      prix:        150.0,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      titre:       'Plomberie urgence',
      description: 'Intervention plomberie urgente 24h/24',
      prix:        200.0,
    },
  });

  // ── Demandes ───────────────────────────────────────────────
  await prisma.demande.create({
    data: {
      clientId:      client1.id,
      prestataireId: presta1.id,
      serviceId:     service1.id,
      description:   'Machine à laver en panne',
      isUrgent:      false,
      status:        'EN_ATTENTE',
    },
  });

  await prisma.demande.create({
    data: {
      clientId:      client2.id,
      prestataireId: presta2.id,
      serviceId:     service2.id,
      description:   '[IoT] Fuite eau détectée',
      isUrgent:      true,
      status:        'EN_COURS',
      sourceIoT:     true,
      deviceId:      'wm-001',
      faultType:     'fuite_eau',
    },
  });

  console.log('✅ Seed terminé avec succès');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());