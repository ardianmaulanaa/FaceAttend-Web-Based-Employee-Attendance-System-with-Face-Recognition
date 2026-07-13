import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum diatur. Tambahkan DATABASE_URL ke file .env atau environment hosting.",
  );
}

const parsedUrl = new URL(databaseUrl);

if (
  parsedUrl.protocol !== "mysql:" &&
  parsedUrl.protocol !== "mariadb:"
) {
  throw new Error(
    `Protocol DATABASE_URL tidak didukung: ${parsedUrl.protocol}. Gunakan mysql:// atau mariadb://`,
  );
}

const databaseName = decodeURIComponent(
  parsedUrl.pathname.replace(/^\/+/, ""),
);

if (!databaseName) {
  throw new Error("Nama database belum tersedia di DATABASE_URL.");
}

const sslAccept = parsedUrl.searchParams.get("sslaccept");
const sslEnabled =
  sslAccept === "strict" ||
  parsedUrl.searchParams.get("ssl") === "true";

const connectionLimit = Number(
  process.env.DATABASE_CONNECTION_LIMIT ?? "5",
);

const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: databaseName,

  connectionLimit:
    Number.isFinite(connectionLimit) && connectionLimit > 0
      ? connectionLimit
      : 5,

  connectTimeout: 10_000,

  ...(sslEnabled
    ? {
        ssl: true,
      }
    : {}),
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
