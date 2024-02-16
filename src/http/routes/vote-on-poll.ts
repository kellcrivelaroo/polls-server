import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { prisma } from "../../lib/prisma"
import { z } from "zod"
import { redis } from "../../lib/redis"
import { votingPubSub } from "../../utils/voting-pub-sub"

export async function voteOnPoll(app: FastifyInstance) {
  app.post('/polls/:pollId/votes', async (req, res) => {
    const voteOnPollParams = z.object({
      pollId: z.string().uuid(),
    })
    const voteOnPollBody = z.object({
      pollOptionId: z.string().uuid(), 
    })
  
    const { pollId } = voteOnPollParams.parse(req.params)
    const { pollOptionId } = voteOnPollBody.parse(req.body)

    let { sessionId } = req.cookies

    if (sessionId) {
      const userPreviousVoteOnPoll = await prisma.vote.findUnique({
        where: {
          sessionId_pollId: {
            sessionId,
            pollId,
          }
        }
      })

      if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {
        await prisma.vote.delete({
          where: {
            id: userPreviousVoteOnPoll.id
          }
        })       
        
        const votes = await redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId)
      
        votingPubSub.publish(pollId, {
          pollOptionId: userPreviousVoteOnPoll.pollOptionId,
          votes: Number(votes),
        })
      } else if (userPreviousVoteOnPoll) {
        return res.status(400).send({ message: 'You already voted on this poll.'})
      }
    }

    if (!sessionId) {
      sessionId = randomUUID()

      res.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        signed: true,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : undefined,
        secure: process.env.NODE_ENV === 'production',
      })
    }

    const vote = await prisma.vote.create({
      data: {
        sessionId,
        pollId,
        pollOptionId,
      }
    })

    const votes = await redis.zincrby(pollId, 1, pollOptionId)

    votingPubSub.publish(pollId, {
      pollOptionId,
      votes: Number(votes),
    })

    return res.status(201).send({ vote })
  })
}