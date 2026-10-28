import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const main = async () => {
  // Apaga as plantas existentes pra rodar o seed várias vezes sempre dar o mesmo resultado
  await prisma.planta.deleteMany();

  await prisma.planta.createMany({
    data: [
      { nome: "Costela-de-adão", especie: "Monstera deliciosa", preco: 8990, estoque: 12, luminosidade: "MEIA_SOMBRA", petFriendly: false, regaACadaDias: 3 },
      { nome: "Samambaia", especie: "Nephrolepis exaltata", preco: 4500, estoque: 20, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 2 },
      { nome: "Espada-de-são-jorge", especie: "Dracaena trifasciata", preco: 3990, estoque: 15, luminosidade: "SOMBRA", petFriendly: false, regaACadaDias: 14 },
      { nome: "Jiboia", especie: "Epipremnum aureum", preco: 3500, estoque: 25, luminosidade: "SOMBRA", petFriendly: false, regaACadaDias: 7 },
      { nome: "Cacto-bola", especie: "Echinopsis calochlora", preco: 2500, estoque: 30, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 21 },
      { nome: "Suculenta Echeveria", especie: "Echeveria elegans", preco: 1990, estoque: 40, luminosidade: "SOL_PLENO", petFriendly: true, regaACadaDias: 10 },
      { nome: "Palmeira-areca", especie: "Dypsis lutescens", preco: 12900, estoque: 0, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 4 },
      { nome: "Orquídea Phalaenopsis", especie: "Phalaenopsis amabilis", preco: 7990, estoque: 0, luminosidade: "MEIA_SOMBRA", petFriendly: true, regaACadaDias: 7 },
    ],
  });

  console.log("Seed concluído: 8 plantas criadas.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });