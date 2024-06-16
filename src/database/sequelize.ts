import pino from "pino";
import { Dialect, Options } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import logger from "../util/logger";
import AuditLogEntry from "./models/AuditLogEntry.model";
import Channel from "./models/Channel.model";
import ChannelRoleAssignment from "./models/ChannelRoleAssignment.model";
import Role from "./models/Role.model";
import Server from "./models/Server.model";
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
    Role,
    Server,
    User,
    UserChannelOverride,
    UserRoleAssignment,
    UserVerificationEmail,
]);

/*
// User
User.hasOne(UserVerificationEmail, { foreignKey: { allowNull: false } });
UserVerificationEmail.belongsTo(User);

// Server
// User -> Server
User.hasMany(Server, { foreignKey: { name: "ownerUuid", allowNull: false } });
Server.belongsTo(User, { as: "owner" });

// Audit log
// Server -> AuditLog
Server.hasMany(AuditLog, {
    foreignKey: { name: "auditLogUuid", allowNull: false },
});
AuditLog.belongsTo(Server, { as: "auditLog" });
// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: { name: "userUuid", allowNull: false } });
AuditLog.belongsTo(User, { as: "user" });

// Channel
// Server and channel
Server.hasMany(Channel, {
    foreignKey: { name: "channelUuid", allowNull: false },
});
Channel.belongsTo(Server, { as: "channel" });

// Role
// Server -> Role
Server.hasMany(Role, { foreignKey: { name: "roleUuid", allowNull: false } });
Role.belongsTo(Server, { as: "role" });

// User Roles
// Role <-> User
User.belongsToMany(Role, { through: UserRoleAssignment });
Role.belongsToMany(User, { through: UserRoleAssignment });

// Channel Roles
// Role <-> Channel
Channel.belongsToMany(Role, { through: ChannelRoleAssignment });
Role.belongsToMany(Channel, { through: ChannelRoleAssignment });

// User Channel Overrides
// User -> UserChannelOverride
User.hasMany(UserChannelOverride, {
    foreignKey: {
        name: "userUuid",
        allowNull: false,
    },
});
UserChannelOverride.belongsTo(User, { as: "user" });
// Channel -> UserChannelOverride
Channel.hasMany(UserChannelOverride, {
    foreignKey: {
        name: "channelUuid",
        allowNull: false,
    },
});
UserChannelOverride.belongsTo(Channel, { as: "channel" });
*/

export default sequelize;
