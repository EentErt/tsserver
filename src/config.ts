import type { MigrationConfig } from "drizzle-orm/migrator";

process.loadEnvFile();
envOrThrow("DB_URL");

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db",
};

type APIConfig = {
    fileserverHits: number;
    dbURL: string;
    db: DBConfig;
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
    }
}

function envOrThrow(key: string): void {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return;
}