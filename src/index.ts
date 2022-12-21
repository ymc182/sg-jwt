import express from "express";
import path from "path";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs/promises";
import cookieParser from "cookie-parser";
const app = express();
app.use(express.static("public"));
const __dirname = path.resolve();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
type User = {
	[username: string]: string;
};

app.get("/", (req, res) => {
	//
	res.setHeader("Content-Type", "text/html");
	res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/login", async (req, res) => {
	console.log(req.body.username);
	const hash = crypto.createHash("sha256");
	const digest = hash.update(req.body.password).digest("hex").toString();
	const token = generateAccessToken(req.body.username, digest);

	let users: User = JSON.parse(await fs.readFile(path.join(__dirname, "users", "jwt.json"), "utf-8"));
	users[req.body.username] = digest;
	await fs.writeFile(path.join(__dirname, "users", "jwt.json"), JSON.stringify(users));
	res.cookie("token", token, { maxAge: 1800000, httpOnly: true });
	res.cookie("username", req.body.username, { maxAge: 1800000, httpOnly: true });
	res.redirect("/");
	//create jwt token
});

app.use(verify).post("/auth", async (req, res) => {
	res.send("You are logged in");
});
app.use(verify).get("/secret", async (req, res) => {
	res.locals.username = req.cookies.username;
	res.sendFile(path.join(__dirname, "public", "secret.html"));
});
//route only for logged in users

app.listen(3000, () => {
	console.log("Server started on port 3000");
});
function generateAccessToken(username: string, hash: string) {
	return jwt.sign({ username: username }, hash, { expiresIn: "1800s" });
}

async function verify(req, res, next) {
	const token: string = req.cookies.token;
	const username = req.cookies.username;
	const users = JSON.parse(await fs.readFile(path.join(__dirname, "users", "jwt.json"), "utf-8"));
	const hash = users[username];
	const promise = new Promise((resolve, rej) => {
		jwt.verify(token, hash, (err, user) => {
			if (err) resolve("");
			resolve(user);
		});
	});
	const result = await promise;

	if (result == "") {
		res.send("You are not logged in");
	} else {
		next();
	}
}
