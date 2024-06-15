import pino from "pino";
import { DataTypes, Dialect, Options, Sequelize } from "sequelize";
import logger from "../util/logger";

// Create logger
const sequelizeLogger = pino({
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
              storage: NATTER_DB_HOST,
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

// Definitions
// User
export const User = sequelize.define("user", {
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

// Server
export const Server = sequelize.define("server", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
});
// User -> Server
User.hasMany(Server, { foreignKey: "ownerUuid" });
Server.belongsTo(User, { as: "owner" });

// Audit log
export const AuditLog = sequelize.define("auditLog", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    msg: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});
// Server -> AuditLog
Server.hasMany(AuditLog, { foreignKey: "auditLogUuid" });
AuditLog.belongsTo(Server, { as: "auditLog" });
// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: "userUuid" });
AuditLog.belongsTo(User, { as: "user" });

// Channel
export const Channel = sequelize.define("channel", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    type: {
        type: DataTypes.ENUM("text", "voice"),
        allowNull: false,
    },
    defaultPermissions: {
        type: DataTypes.JSON,
        allowNull: false,
    },
});
// Server and channel
Server.hasMany(Channel, { foreignKey: "channelUuid" });
Channel.belongsTo(Server, { as: "channel" });

// Role
export const Role = sequelize.define("role", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: false,
    },
});
// Server -> Role
Server.hasMany(Role, { foreignKey: "roleUuid" });
Role.belongsTo(Server, { as: "role" });

// User Roles
const UserRoleAssignment = sequelize.define("userRoleAssignment", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
});
// Role <-> User
User.belongsToMany(Role, { through: UserRoleAssignment });
Role.belongsToMany(User, { through: UserRoleAssignment });

// Channel Roles
const ChannelRoleAssignment = sequelize.define("channelRoleAssignment", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    overridePermissions: {
        type: DataTypes.JSON,
    },
});
// Role <-> Channel
Channel.belongsToMany(Role, { through: ChannelRoleAssignment });
Role.belongsToMany(Channel, { through: ChannelRoleAssignment });

// User Channel Overrides
const UserChannelOverride = sequelize.define("userChannelOverride", {
    uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    overridePermissions: {
        type: DataTypes.JSON,
    },
});
// User -> UserChannelOverride
User.hasMany(UserChannelOverride, { foreignKey: "userUuid" });
UserChannelOverride.belongsTo(User, { as: "user" });
// Channel -> UserChannelOverride
Channel.hasMany(UserChannelOverride, { foreignKey: "channelUuid" });
UserChannelOverride.belongsTo(Channel, { as: "channel" });

// Sync database
sequelize
    .sync({ alter: true })
    .then(() => {
        sequelizeLogger.info("Database Sync Completed");
        logger.info("Database Sync Completed");
    })
    .catch((err) => {
        sequelizeLogger.fatal(err, "Database Sync Failed");
        logger.fatal(err, "Database Sync Failed");
        process.exit(1);
    });

export default sequelize;
