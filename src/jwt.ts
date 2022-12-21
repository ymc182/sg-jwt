import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
const __dirname = path.resolve();
export async function verify(req, res, next) {
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
export function generateAccessToken(username: string, hash: string) {
	return jwt.sign({ username: username }, hash, { expiresIn: "1800s" });
}
