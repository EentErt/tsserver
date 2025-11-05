process.loadEnvFile();
envOrThrow("DB_URL");
envOrThrow("PLATFORM");
envOrThrow("SECRET");
envOrThrow("POLKA_KEY");
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
    secret: process.env.SECRET,
    polkaKey: process.env.POLKA_KEY,
};
function envOrThrow(key) {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return;
}
