import express, { Response, Request, NextFunction } from "express";
import { config } from "./config.js";
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from "./errors.js";
import { NewRefreshToken, NewUser, users } from "./db/schemas/schema.js";
import { NewChirp, chirps } from "./db/schemas/schema.js";
import { createRefreshToken, getRefreshToken, revokeRefreshToken } from "./db/queries/refresh_tokens.js";
import { createUser, getUserByEmail, getUserFromRefreshToken, resetUsers } from "./db/queries/users.js";
import { createChirp, getChirpById, getChirps } from "./db/queries/chirps.js";

import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT, getBearerToken, makeRefreshToken } from "./auth.js";
import { JsonWebTokenError } from "jsonwebtoken";

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

app.post("/api/users", handlerCreateUser);
app.post("/admin/reset", handlerReset);
app.post("/api/chirps", handlerPostChirps);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerHits);
app.get("/api/chirps", handlerGetChirps);
app.get("/api/chirps/:chirpID", handlerGetChirpById);
app.post("/api/login", handlerLogin);
app.post("/api/refresh", handlerRefresh);
app.post("/api/revoke", handlerRevoke);

app.use(errorHandler);

type UserPreview = Omit<NewUser, "hashedPassword">;

async function handlerCreateUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.body.password) {
      throw new BadRequestError("Password is required");
    }
    const hash = await hashPassword(req.body.password);
    const user: NewUser = {
      email: req.body.email,
      hashedPassword: hash,
    }

    const newUser = await createUser(user);
    const {hashedPassword, ...preview} = newUser;
    res.header("Content-Type", "application/json");
    res.status(201).send(JSON.stringify(preview));
  } catch (error) {
    throw error;
  }
}

async function handlerLogin(req: Request, res: Response): Promise<void> {
  const user = await getUserByEmail(req.body.email);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const passwordValid = await checkPasswordHash(req.body.password, user.hashedPassword);
  if (!passwordValid) {
    throw new UnauthorizedError("Invalid password");
  }

  const {hashedPassword, ...preview} = user;

  const refreshToken: NewRefreshToken = {
    token: makeRefreshToken(),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
  }

  await createRefreshToken(refreshToken);


  type TokenResponse = UserPreview & {
    token: string;
    refreshToken: string;
  }

  const token = makeJWT(user.id.toString(), 3600, config.secret);

  const tokenResponse: TokenResponse = {
    ...preview,
    token: token,
    refreshToken: refreshToken.token,
  }

  res.header("Content-Type", "application/json");
  res.status(200).send(JSON.stringify(tokenResponse))
}

async function handlerRefresh(req: Request, res: Response): Promise<void> {
  try {
    const token = getBearerToken(req);
    const valid = await getRefreshToken(token);
    if (!valid) {
      throw new UnauthorizedError("Invalid refresh token");
    } else if (valid.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    } else if (valid.revokedAt) {
      throw new UnauthorizedError("Refresh token revoked");
    }

    const user = await getUserFromRefreshToken(token);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const newToken = makeJWT(user.id.toString(), 3600, config.secret);



    res.header("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({ token: newToken }));
  } catch (error) {
    throw error;
  }
}

async function handlerRevoke(req: Request, res: Response): Promise<void> {
  try {
    const token = getBearerToken(req);
    await revokeRefreshToken(token);

    res.status(204).send();

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

async function handlerGetChirps(req: Request, res: Response): Promise<void> {
  try {
    const chirps = await getChirps();
    res.header("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(chirps));
  } catch (error) {
    throw error;
  }
}

async function handlerGetChirpById(req: Request, res: Response): Promise<void> {
  try {
    const chirp = await getChirpById(req.params.chirpID);
    console.log("Getting chirp with id:", req.params.chirpID);
    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }
    res.header("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(chirp));
  } catch (error) {
    throw error;
  }
}

async function handlerPostChirps(req: Request, res: Response): Promise<void> {
  try {
    const token = getBearerToken(req);
    const userID = validateJWT(token, config.secret);


    const newChirp: NewChirp = {
      body: validateChirp(req.body.body),
      userId: userID,
    }

    const chirp = await createChirp(newChirp);
    res.header("Content-Type", "application/json");
    res.status(201).send(chirp);
  } catch (error) {
    throw error;
  }
}

function validateChirp(chirp: string): string {
  try {
    const cleanedChirp = cleanChirp(chirp)
    if (chirp.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    return cleanedChirp;  
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

async function handlerReset(req: Request, res: express.Response): Promise<void> {
  if (config.platform !== "dev") {
    throw new ForbiddenError("Reset is only allowed in dev platform");
  }

  await resetUsers();

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