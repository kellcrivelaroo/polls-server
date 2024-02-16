"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollResults = void 0;
const zod_1 = require("zod");
const voting_pub_sub_1 = require("../../utils/voting-pub-sub");
async function pollResults(app) {
    app.get('/polls/:pollId/results', { websocket: true }, (connection, req) => {
        const getPollParams = zod_1.z.object({
            pollId: zod_1.z.string().uuid(),
        });
        const { pollId } = getPollParams.parse(req.params);
        voting_pub_sub_1.votingPubSub.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message));
        });
    });
}
exports.pollResults = pollResults;
