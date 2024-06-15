import pino from "pino";

const { NATTER_LOG_LEVEL } = process.env;

const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            destination: "./logs/latest.log",
            mkdir: true,
            colorize: false,
            append: false,
            minimumLevel: NATTER_LOG_LEVEL ?? "info",
        },
    },
});

export default logger;
