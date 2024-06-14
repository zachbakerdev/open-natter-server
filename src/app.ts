import express from "express";
import logger from "./util/logger";

const port = 8080;

const app = express();

app.get("*", (req, res) => {
    res.send("Hello world!");
});

app.listen(port, async () => {
    logger.info(`App listening on port ${port}.`);
});
