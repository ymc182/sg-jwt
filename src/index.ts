import express from "express";
import path from "path";
import bodyParser from "body-parser";

import crypto from "crypto";
import fs from "fs/promises";
import cookieParser from "cookie-parser";
import { generateAccessToken, verify } from "./jwt.js";
import { User } from "./types.js";
import { expires } from "./constants.js";
import { fetchUsers } from "./routes/users.js";
import { buildSchema } from "graphql";
import { graphqlHTTP } from "express-graphql";
const app = express();
app.use(express.static("public"));

var coursesData = [
	{
		id: 1,
		title: "The Complete Node.js Developer Course",
		author: "Andrew Mead, Rob Percival",
		description: "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
		topic: "Node.js",
		url: "https://codingthesmartway.com/courses/nodejs/",
	},
	{
		id: 2,
		title: "Node.js, Express & MongoDB Dev to Deployment",
		author: "Brad Traversy",
		description: "Learn by example building & deploying real-world Node.js applications from absolute scratch",
		topic: "Node.js",
		url: "https://codingthesmartway.com/courses/nodejs-express-mongodb/",
	},
	{
		id: 3,
		title: "JavaScript: Understanding The Weird Parts",
		author: "Anthony Alicea",
		description:
			"An advanced JavaScript course for everyone! Scope, closures, prototypes, this, build your own framework, and more.",
		topic: "JavaScript",
		url: "https://codingthesmartway.com/courses/understand-javascript/",
	},
];
const __dirname = path.resolve();
const PORT = process.env.PORT || 3001;

var schema = buildSchema(`
    type Query {
        course(id: Int!): Course
        courses(topic: String): [Course]
    },
    type Course {
        id: Int
        title: String
        author: String
        description: String
        topic: String
        url: String
    }
`);
//create a schema with a object type and field name and password

var getCourse = function (args) {
	var id = args.id;
	return coursesData.filter((course) => {
		return course.id == id;
	})[0];
};
var getCourses = function (args) {
	if (args.topic) {
		var topic = args.topic;
		return coursesData.filter((course) => course.topic === topic);
	} else {
		return coursesData;
	}
};
var root = {
	course: getCourse,
	courses: getCourses,
};

app.use(
	"/graphql",
	graphqlHTTP({
		schema: schema,
		rootValue: root,
		graphiql: true,
	})
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.get("/", (req, res) => {
	//
	res.setHeader("Content-Type", "text/html");
	res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/createAccount", async (req, res) => {
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

//gated route

app.post("/auth", verify, async (req, res) => {
	res.send("You are logged in");
});
app.get("/secret", verify, async (req, res) => {
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
