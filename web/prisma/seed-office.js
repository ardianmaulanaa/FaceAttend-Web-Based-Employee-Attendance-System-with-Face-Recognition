import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || undefined,
  database: process.env.DATABASE_NAME || "faceattend_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.officeLocation.upsert({
    where: {
      id: "office-1",
    },
    update: {
      name: "Agency CV Mulya Kreatif Cipta",
      address: "Alamat kantor Agency CV Mulya Kreatif Cipta",
      latitude: -6.917464,
      longitude: 107.619123,
      radius_meters: 100,
      status: "active",
    },
    create: {
      id: "office-1",
      name: "Agency CV Mulya Kreatif Cipta",
      address: "Alamat kantor Agency CV Mulya Kreatif Cipta",
      latitude: -6.917464,
      longitude: 107.619123,
      radius_meters: 100,
      status: "active",
    },
  });

  await prisma.officeLocation.upsert({
    where: {
      id: "office-2",
    },
    update: {
      name: "Creativemu Academy",
      address: "Jogja",
      latitude: -7.812201,
      longitude: 110.2685415,
      radius_meters: 100,
      status: "active",
    },
    create: {
      id: "office-2",
      name: "Creativemu Academy",
      address: "Jogja",
      latitude: -7.812201,
      longitude: 110.2685415,
      radius_meters: 100,
      status: "active",
    },
  });

  console.log("Data kantor berhasil dibuat.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });