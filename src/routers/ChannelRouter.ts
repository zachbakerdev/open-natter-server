import { Router } from "express";
import strings from "../constants/strings";
import Channel from "../database/models/Channel.model";
import Server from "../database/models/Server.model";
import authenticate, { AuthenticatedRequest } from "../middleware/authenticate";
import logger from "../util/logger";
import { Permission, hasPermission } from "../util/permissions";

export const CHANNEL_NAME_REGEX = /^[A-Za-z][A-Za-z0-9 -_]{1,28}[A-Za-z0-9]$/;

const ChannelRouter = Router();

ChannelRouter.use(authenticate);

ChannelRouter.post("/", async (req, res) => {
    try {
        const { user } = req as AuthenticatedRequest;
        const { type, name, serverUuid } = req.body;

        if (type !== "text" && type !== "voice")
            return res.status(400).json({ msg: strings.bad_request });
        if (!CHANNEL_NAME_REGEX.test(name))
            return res.status(400).json({ msg: strings.bad_request });

        const server = Server.findOne({ where: { uuid: serverUuid } });

        if (server === null)
            return res.status(404).json({ msg: strings.not_found });
        if (!user.canCreateServers)
            return res.status(403).json({ msg: strings.forbidden });

        const canManageChannels = user.roles.some((role) =>
            hasPermission(Permission.MANAGE_CHANNEL, role.defaultPermissions),
        );
        if (!canManageChannels)
            return res.status(403).json({ msg: strings.forbidden });

        const channel = await Channel.create({
            type,
            name,
            serverUuid,
            defaultPermissions: 0,
        });

        res.status(200).json({ msg: strings.channel_success });
    } catch (err) {
        logger.error(err, "channel creation error");
        res.status(500).json({ msg: strings.internal_server_error });
    }
});

export default ChannelRouter;
