process.loadEnvFile();
envOrThrow("DB_URL");
envOrThrow("PLATFORM");
const migrationConfig = {
    migrationsFolder: "./src/db",
};
export const config = {
    fileserverHits: 0,
    dbURL: process.env.DB_URL,
    db: {
        url: process.env.DB_URL,
        migrationConfig: migrationConfig,
    },
    platform: process.env.PLATFORM,
};
function envOrThrow(key) {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return;
}
