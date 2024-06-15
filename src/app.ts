import express from "express";
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

app.listen(port, () => {
    logger.info(`App listening on port ${port}.`);
});
