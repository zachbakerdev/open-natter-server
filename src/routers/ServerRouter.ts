import { Router } from "express";
import strings from "../constants/strings";
import Server from "../database/models/Server.model";
import authenticate, { AuthenticatedRequest } from "../middleware/authenticate";
import logger from "../util/logger";

export const SERVER_NAME_REGEX = /^[A-Za-z][A-Za-z0-9 \-_]{1,28}[A-Za-z0-9]$/;

const ServerRouter = Router();

ServerRouter.use(authenticate);

ServerRouter.post("/", async (req, res) => {
    try {
        // get user permissions
        const { user } = req as AuthenticatedRequest;
        const { name } = req.body;

        if (!SERVER_NAME_REGEX.test(name))
            return res.status(400).json({ msg: strings.bad_request });

        if (!user.canCreateServers)
            return res.status(403).json({ msg: strings.forbidden });

        const server = await Server.create({
            ownerUuid: user.uuid,
        });

        res.status(200).json({
            msg: strings.server_create_success,
            server: server.toJSON(),
        });
    } catch (err) {
        logger.error(err, "server creation error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

export default ServerRouter;
