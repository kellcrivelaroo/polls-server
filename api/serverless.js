"use strict";
import * as dotenv from "dotenv";
dotenv.config();

let app

export default async (req, res) => {
  if (!app) {
    const serverModule = await import("../src/http/server.ts");
    app = serverModule.default;
    await app.ready();
  }
  app.server.emit('request', req, res);
};