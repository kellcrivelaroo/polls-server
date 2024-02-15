import { FastifyInstance } from "fastify"
import { prisma } from "../../lib/prisma"
import { z } from "zod"
import { redis } from "../../lib/redis"

export async function getPoll(app: FastifyInstance) {
  app.get('/polls/:pollId', async (req, res) => {
    const getPollParams = z.object({
      pollId: z.string().uuid(),
    })
    const { pollId } = getPollParams.parse(req.params)

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId,
      },
      include: {
        options: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    if (!poll) {
      return res.status(400).send({message: 'Poll not found'})
    }

    const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')


    const votes = result.reduce((obj, row, i, results) => {
      if (i % 2 === 0) {
        Object.assign(obj, { [row]: Number(results[i + 1])  })
      }
      return obj
    }, {} as Record<string, number>)

    return res.send({ poll: {
      ...poll,
      options: poll.options.map((option) => ({
        ...option,
        votes: (option.id in votes) ? votes[option.id] : 0
      }))
    } })
  })
}