"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoll = void 0;
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
const redis_1 = require("../../lib/redis");
async function getPoll(app) {
    app.get('/polls/:pollId', async (req, res) => {
        const getPollParams = zod_1.z.object({
            pollId: zod_1.z.string().uuid(),
        });
        const { pollId } = getPollParams.parse(req.params);
        const poll = await prisma_1.prisma.poll.findUnique({
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
        });
        if (!poll) {
            return res.status(400).send({ message: 'Poll not found' });
        }
        const result = await redis_1.redis.zrange(pollId, 0, -1, 'WITHSCORES');
        const votes = result.reduce((obj, row, i, results) => {
            if (i % 2 === 0) {
                Object.assign(obj, { [row]: Number(results[i + 1]) });
            }
            return obj;
        }, {});
        return res.send({ poll: {
                ...poll,
                options: poll.options.map((option) => ({
                    ...option,
                    votes: (option.id in votes) ? votes[option.id] : 0
                }))
            } });
    });
}
exports.getPoll = getPoll;
