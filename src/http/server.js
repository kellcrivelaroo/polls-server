"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const cors_1 = __importDefault(require("@fastify/cors"));
const create_poll_1 = require("./routes/create-poll");
const get_poll_1 = require("./routes/get-poll");
const vote_on_poll_1 = require("./routes/vote-on-poll");
const poll_results_1 = require("./ws/poll-results");
const app = (0, fastify_1.default)();
const port = Number(process.env.PORT) || 3333;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;
app.register(cors_1.default, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', '*'],
    credentials: true,
    maxAge: 86400,
});
app.register(cookie_1.default, {
    secret: 'QWOJ2198yuijoDWQN',
    hook: 'onRequest',
});
app.register(websocket_1.default);
app.get('/', (req, res) => {
    res.send({ hello: 'world' });
});
app.register(get_poll_1.getPoll);
app.register(create_poll_1.createPoll);
app.register(vote_on_poll_1.voteOnPoll);
app.register(poll_results_1.pollResults);
app.listen({ port, host }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }
});
