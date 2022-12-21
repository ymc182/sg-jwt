import express from "express";
import path from "path";
import bodyParser from "body-parser";

import crypto from "crypto";
import fs from "fs/promises";
import cookieParser from "cookie-parser";
import { generateAccessToken, verify } from "./jwt.js";
import { User } from "./types.js";
import { expires } from "./constants.js";
const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

const __dirname = path.resolve();
const PORT = process.env.PORT || 3001;

app.get("/", (req, res) => {
	//
	res.setHeader("Content-Type", "text/html");
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", async (req, res) => {
	// Generate the hash and the token
	const hash = generateHash(req.body.username, req.body.password);
	const token = generateAccessToken(req.body.username, hash);
	// Save the hash to the file
	let users: User = JSON.parse(await fs.readFile(path.join(__dirname, "users", "jwt.json"), "utf-8"));
	users[req.body.username] = hash;
	await fs.writeFile(path.join(__dirname, "users", "jwt.json"), JSON.stringify(users));
	// Save the token to the cookie
	res.cookie("token", token, { maxAge: expires, httpOnly: true });
	res.cookie("username", req.body.username, { maxAge: expires, httpOnly: true });
	res.redirect("/");
});

app.use(verify).post("/auth", async (req, res) => {
	res.send("You are logged in");
});

app.use(verify).get("/secret", async (req, res) => {
	res.locals.username = req.cookies.username;
	res.sendFile(path.join(__dirname, "public", "secret.html"));
});

app.listen(PORT, () => {
	console.log("Server started on port " + PORT);
});

function generateHash(username: string, password: string) {
	const hash = crypto.createHash("sha256");
	return hash.update(`${username}:${password}`).digest("hex").toString();
}
