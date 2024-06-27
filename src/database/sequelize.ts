import pino from "pino";
import { Dialect, Options } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import logger from "../util/logger";
import AuditLogEntry from "./models/AuditLogEntry.model";
import Channel from "./models/Channel.model";
import ChannelRoleAssignment from "./models/ChannelRoleAssignment.model";
import Registration from "./models/Registration.model";
import Role from "./models/Role.model";
import Server from "./models/Server.model";
import Token from "./models/Token.model";
import User from "./models/User.model";
import UserChannelOverride from "./models/UserChannelOverride.model";
import UserRoleAssignment from "./models/UserRoleAssignment.model";
import UserVerificationEmail from "./models/UserVerificationEmail.model";

// Create logger
export const sequelizeLogger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            destination: "./logs/database.log",
            mkdir: true,
            colorize: false,
            append: true,
            minimumLevel: "info",
            ignore: "hostname,pid",
            translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        },
    },
});

// Import environment variables
const {
    NATTER_DB_DIALECT,
    NATTER_DB_DATABASE,
    NATTER_DB_USERNAME,
    NATTER_DB_PASSWORD,
    NATTER_DB_HOST,
    NATTER_DB_PORT,
} = process.env;

// Check for valid dialect
const AVAILALBE_DIALECTS = ["mysql", "postgres", "sqlite", "mariadb"];
if (!NATTER_DB_DIALECT || !AVAILALBE_DIALECTS.includes(NATTER_DB_DIALECT)) {
    sequelizeLogger.fatal("Invalid Dialect");
    logger.fatal("Invalid Dialect");
    process.exit(1);
}

// Function for retrieving the default database prot
const getDefaultDatabasePort = (dialect: Dialect): number => {
    switch (dialect) {
        case "mysql":
        case "mariadb":
            return 3306;
        case "postgres":
            return 5432;
        default:
            throw new Error(`Dialect ${dialect} not supported.`);
    }
};

if (NATTER_DB_DIALECT === "sqlite" && !NATTER_DB_DATABASE) {
    logger.warn("No database file specified. Creating temporary database in memory.");
}

// Generate parameters
const sequelizeParams: Options =
    NATTER_DB_DIALECT === "sqlite"
        ? {
              dialect: "sqlite",
              storage: NATTER_DB_DATABASE,
              logging: (msg) => sequelizeLogger.info(msg),
          }
        : {
              dialect: NATTER_DB_DIALECT as Dialect,
              database: NATTER_DB_DATABASE,
              username: NATTER_DB_USERNAME,
              password: NATTER_DB_PASSWORD,
              host: NATTER_DB_HOST,
              port: NATTER_DB_PORT
                  ? Number(NATTER_DB_PORT)
                  : getDefaultDatabasePort(NATTER_DB_DIALECT as Dialect),
              logging: (msg) => sequelizeLogger.info(msg),
          };

// Create connection
const sequelize = new Sequelize(sequelizeParams);

// Test authentication
sequelize.authenticate().catch((err) => {
    sequelizeLogger.fatal("Failed to authenticate database", err);
    logger.fatal("Failed to authenticate database", err);
    process.exit(1);
});

sequelize.addModels([
    AuditLogEntry,
    Channel,
    ChannelRoleAssignment,
    Registration,
    Role,
    Server,
    Token,
    User,
    UserChannelOverride,
    UserRoleAssignment,
    UserVerificationEmail,
]);

export default sequelize;
