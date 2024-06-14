import { DataTypes, Dialect, Options, Sequelize } from "sequelize";
import logger from "../util/logger";
import pino from "pino";

// Create logger
const sequalizeLogger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            destination: "./logs/database.log",
            mkdir: true,
            colorize: false,
            include: "time,level",
            append: true,
            minimumLevel: "info",
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
    sequalizeLogger.fatal("Invalid Dialect");
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

// Generate parameters
const sequelizeParams: Options =
    NATTER_DB_DIALECT === "sqlite"
        ? {
              dialect: "sqlite",
              storage: NATTER_DB_HOST,
              logging: (msg) => sequalizeLogger.info(msg),
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
              logging: (msg) => sequalizeLogger.info(msg),
          };

// Create connection
const sequelize = new Sequelize(sequelizeParams);

// Test authentication
sequelize.authenticate().catch((err) => {
    sequalizeLogger.fatal("Failed to authenticate database", err);
    logger.fatal("Failed to authenticate database", err);
    process.exit(1);
});

// Definitions
export const User = sequelize.define("User", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    two_factor_authentication_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    two_factor_authentication_secret: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

// Sync database
sequelize
    .sync({ alter: true })
    .then(() => {
        sequalizeLogger.info("Database Sync Completed");
        logger.info("Database Sync Completed");
    })
    .catch((err) => {
        sequalizeLogger.fatal(err, "Database Sync Failed");
        logger.fatal(err, "Database Sync Failed");
        process.exit(1);
    });

export default sequelize;
