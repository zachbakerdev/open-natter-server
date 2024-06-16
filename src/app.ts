import express from "express";
import sequelize, { sequelizeLogger } from "./database/sequelize";
import ChannelRouter from "./routers/ChannelRouter";
import ServerRouter from "./routers/ServerRouter";
import UserRouter from "./routers/UserRouter";
import logger from "./util/logger";

// Define port
const port = 8080;

// Create app
const app = express();

// Enable JSON parsing
app.use(express.json());

// Routers
app.use("/user", UserRouter);
app.use("/server", ServerRouter);
app.use("/server", ChannelRouter);

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
