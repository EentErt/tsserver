import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();
envOrThrow("DB_URL");
envOrThrow("PLATFORM");
envOrThrow("SECRET");

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db",
};

type APIConfig = {
    fileserverHits: number;
    dbURL: string;
    db: DBConfig;
    platform: string;
    secret: string;
};

type DBConfig = {
    url: string;
    migrationConfig: MigrationConfig;
}

export const config: APIConfig = {
    fileserverHits: 0,
    dbURL: process.env.DB_URL!,
    db: {
        url: process.env.DB_URL!,
        migrationConfig: migrationConfig,
    },
    platform: process.env.PLATFORM!,
    secret: process.env.SECRET!,
}

function envOrThrow(key: string): void {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return;
}