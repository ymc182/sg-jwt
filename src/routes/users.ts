import express from "express";

import { graphqlHTTP } from "express-graphql";
import { buildSchema } from "graphql";

const schema = buildSchema(`
	type Query {
		hello: String
	}
`);

const root = {
	hello: () => "Hello world!",
};

export const fetchUsers = graphqlHTTP({
	schema: schema,
	rootValue: root,
	graphiql: true,
});
