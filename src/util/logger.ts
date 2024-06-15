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
            ignore: "hostname,pid",
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        },
    },
});

export default logger;
