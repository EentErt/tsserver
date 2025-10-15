import express from "express";
import { config } from "./config.js";
const app = express();
const PORT = 8080;
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);
app.use("/metrics", handlerHits);
app.use("/reset", handlerReset);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
app.get("/healthz", handlerReadiness);
app.get("/metrics", handlerHits);
function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain");
    res.status(200).send("OK");
    return;
}
function handlerHits(req, res) {
    res.set("Content-Type", "text/plain");
    res.status(200).send("Hits: " + config.fileserverHits);
    return;
}
function handlerReset(req, res) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain");
    res.status(200).send("OK");
    return;
}
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        if (res.statusCode !== 200) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}
function middlewareMetricsInc(req, res, next) {
    config.fileserverHits += 1;
    next();
}
