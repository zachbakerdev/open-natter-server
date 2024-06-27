import express from "express";
import proxy from "express-http-proxy";
import strings from "./constants/strings";
import sequelize, { sequelizeLogger } from "./database/sequelize";
import ChannelRouter from "./routers/ChannelRouter";
import FileRouter from "./routers/FileRouter";
import ServerRouter from "./routers/ServerRouter";
import UserRouter from "./routers/UserRouter";
import logger from "./util/logger";

// Define port
const port = 8080;
const prefix = "/api";

// Create app
const app = express();

// Enable JSON parsing
app.use(express.json());

// Routers
app.use(prefix + "/user", UserRouter);
app.use(prefix + "/server", ServerRouter);
app.use(prefix + "/channel", ChannelRouter);
app.use(prefix + "/files", FileRouter);

app.use(prefix + "/files", express.static("upload", {fallthrough: false, index: false}));

app.use(prefix + "/*", (req, res) => {
    res.status(404).json({msg: strings.not_found})
});

app.use("*", proxy("http://127.0.0.1:3000/", {
    proxyReqPathResolver: req => req.originalUrl
}));

// Sync database and start server
sequelize
    .sync({ alter: true })
    .then(() => {
        sequelizeLogger.info("Database Sync Completed");
        logger.info("Database Sync Completed");
    })
    .then(() => {
        app.listen(port, () => {
            logger.info(`App listening on port ${port}.`);
        });
    })
    .catch((err) => {
        sequelizeLogger.fatal(err, "Database Sync Failed");
        logger.fatal(err, "Database Sync Failed");
        process.exit(1);
    });