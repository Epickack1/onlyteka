// server/graphql/index.js
// Подключение Apollo Server к существующему Express-приложению.
// Если @apollo/server не установлен — endpoint не регистрируется,
// сервер продолжает работать с REST API.

const express = require('express');
const jwt = require('jsonwebtoken');
const { ACCESS_SECRET } = require('../config/jwt');

let ApolloServer = null;
let expressMiddleware = null;
try {
    ({ ApolloServer } = require('@apollo/server'));
    ({ expressMiddleware } = require('@apollo/server/express4'));
} catch {
    console.warn('[graphql] @apollo/server не установлен — GraphQL-endpoint отключён (npm install)');
}

function buildContext({ req }) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return { user: null };
    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        return { user: payload };
    } catch {
        return { user: null };
    }
}

async function attachGraphQL(app) {
    if (!ApolloServer) return;

    const typeDefs = require('./typeDefs');
    const resolvers = require('./resolvers');

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true
    });

    await server.start();

    app.use(
        '/graphql',
        express.json(),
        expressMiddleware(server, { context: async (ctx) => buildContext(ctx) })
    );

    console.log('GraphQL endpoint: /graphql (Apollo Sandbox в браузере)');
}

module.exports = attachGraphQL;
