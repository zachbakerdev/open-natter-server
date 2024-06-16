import pino from "pino";
import { DataTypes, Dialect, Model, Options, Sequelize } from "sequelize";
import {
    Column,
    Default,
    NotNull,
    PrimaryKey,
    Table,
    Unique,
} from "sequelize-typescript";
import logger from "../util/logger";

// Create logger
const sequelizeLogger = pino({
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

// Definitions
// User
@Table
export class User extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.STRING)
    @Unique
    @NotNull
    username: string;

    @Column(DataTypes.STRING)
    @Unique
    @NotNull
    email: string;

    @Column(DataTypes.BOOLEAN)
    @NotNull
    @Default(false)
    email_verified: boolean;

    @Column(DataTypes.BOOLEAN)
    @NotNull
    @Default(false)
    two_factor_authentication_enabled: boolean;

    @Column(DataTypes.TEXT)
    two_factor_authentication_secret: string;

    @Column(DataTypes.STRING)
    @NotNull
    password: string;
}

@Table
export class UserVerificationEmail extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;
}

User.hasOne(UserVerificationEmail, { foreignKey: { allowNull: false } });
UserVerificationEmail.belongsTo(User);

// Server
@Table
export class Server extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;
}
// User -> Server
User.hasMany(Server, { foreignKey: { name: "ownerUuid", allowNull: false } });
Server.belongsTo(User, { as: "owner" });

// Audit log
@Table
export class AuditLog extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.TEXT)
    @NotNull
    msg: string;
}
// Server -> AuditLog
Server.hasMany(AuditLog, {
    foreignKey: { name: "auditLogUuid", allowNull: false },
});
AuditLog.belongsTo(Server, { as: "auditLog" });
// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: { name: "userUuid", allowNull: false } });
AuditLog.belongsTo(User, { as: "user" });

// Channel
@Table
export class Channel extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.ENUM("text", "voice"))
    @NotNull
    type: string;

    @Column(DataTypes.JSON)
    @NotNull
    defaultPermissions: object;
}
// Server and channel
Server.hasMany(Channel, {
    foreignKey: { name: "channelUuid", allowNull: false },
});
Channel.belongsTo(Server, { as: "channel" });

// Role
@Table
export class Role extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.JSON)
    @NotNull
    permissions: object;
}
// Server -> Role
Server.hasMany(Role, { foreignKey: { name: "roleUuid", allowNull: false } });
Role.belongsTo(Server, { as: "role" });

// User Roles
@Table
export class UserRoleAssignment extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;
}
// Role <-> User
User.belongsToMany(Role, { through: UserRoleAssignment });
Role.belongsToMany(User, { through: UserRoleAssignment });

// Channel Roles
@Table
export class ChannelRoleAssignment extends Model {
    @Column
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.JSON)
    @NotNull
    overridePermissions: object;
}
// Role <-> Channel
Channel.belongsToMany(Role, { through: ChannelRoleAssignment });
Role.belongsToMany(Channel, { through: ChannelRoleAssignment });

// User Channel Overrides
export class UserChannelOverride extends Model {
    @Column(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    @Default(DataTypes.UUIDV4)
    uuid: string;

    @Column(DataTypes.JSON)
    @NotNull
    overridePermissions: object;
}
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
