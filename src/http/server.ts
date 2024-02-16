import fastify from 'fastify'
import cookie from '@fastify/cookie'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors';

import { createPoll } from './routes/create-poll'
import { getPoll } from './routes/get-poll'
import { voteOnPoll } from './routes/vote-on-poll'
import { pollResults } from './ws/poll-results'

const app = fastify()
const port = Number(process.env.PORT) || 3333;
const host = ("RENDER" in process.env) ? `0.0.0.0` : `localhost`;

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', '*'],
  credentials: true,
  maxAge:  86400,
});

app.register(cookie, {
  secret: 'QWOJ2198yuijoDWQN',
  hook: 'onRequest',
})

app.register(websocket)

app.get('/', (req, res) => {
  res.send({ hello: 'world' })
})

app.register(getPoll)
app.register(createPoll)
app.register(voteOnPoll)

app.register(pollResults)

app.listen({ port, host }, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
