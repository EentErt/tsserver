import express, { Response, Request, NextFunction } from "express";
import { config } from "./config.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from "./errors.js";
import { NewUser, users } from "./db/schemas/schema.js";
import { createUser } from "./db/queries/users.js";

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);
app.use("/admin/metrics", handlerHits);
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

app.post("/api/validate_chirp", handlerValidateChirp);
app.post("/api/users", handlerCreateUser);
app.post("/admin/reset", handlerReset);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerHits);

app.use(errorHandler);

async function handlerCreateUser(req: Request, res: Response): Promise<void> {
  try {
    const user: NewUser = {
      email: req.body.email,
    }
    const newUser = await createUser(user);
    res.header("Content-Type", "application/json");
    res.status(201).send(JSON.stringify(newUser));
  } catch (error) {
    throw error;
  }
}

function handlerReadiness(req: Request, res: express.Response): void {
  res.set("Content-Type", "text/plain");
  res.status(200).send("OK");
  return;
}

function handlerHits(req: Request, res: express.Response): void {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
<html>
  <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>
  `);
  return;
}

function handlerValidateChirp(req: Request, res: express.Response): void {
  type Chirp = {
    body: string;
  };

  try {
    const parsedBody: Chirp = req.body;
    const cleanedChirp = cleanChirp(parsedBody.body)
    if (parsedBody.body.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    res.header("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({ "cleanedBody": cleanedChirp }));  
  } catch (error) {
    throw error;
  }
}

function cleanChirp(chirp: string): string {
  const bannedWords = ["kerfuffle", "sharbert", "fornax"];
  let wordList = chirp.split(" ");
  let cleanedList = [];
  for (let word of wordList) {
    if (bannedWords.includes(word.toLowerCase())) {
      cleanedList.push("****");
      continue;
    }
    cleanedList.push(word);
  }

  return cleanedList.join(" ");
}

function handlerReset(req: Request, res: express.Response): void {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain");
  res.status(200).send("OK");
  return;
}


function middlewareLogResponses(req: Request, res: Response, next: NextFunction): void {
  res.on("finish", () => {
    if (res.statusCode !== 200) {
      console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  })
  next();
}

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  config.fileserverHits += 1;
  next();
}

function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(err);
  if (err instanceof BadRequestError) {
    res.status(400);
  } else if (err instanceof UnauthorizedError) {
    res.status(401);
  } else if (err instanceof ForbiddenError) {
    res.status(403);
  } else if (err instanceof NotFoundError) {
    res.status(404);
  } else {
    res.status(500);
  }
  res.send(JSON.stringify({ "error": err.message }));
}