"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
exports.redis = new ioredis_1.Redis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: Number(process.env.REDIS_PORT),
});
