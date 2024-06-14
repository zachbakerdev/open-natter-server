import { DataTypes, Dialect, Options, Sequelize } from "sequelize";
import logger from "../util/logger";

// Import environment variables
const {
    NATTER_DB_DIALECT,
    NATTER_DB_DATABASE,
    NATTER_DB_USERNAME,
    NATTER_DB_PASSWORD,
    NATTER_DB_HOST,
    NATTER_DB_PORT
} = process.env;

// Check for valid dialect
const AVAILALBE_DIALECTS = ["mysql", "postgres", "sqlite", "mariadb"];
if (!NATTER_DB_DIALECT || !AVAILALBE_DIALECTS.includes(NATTER_DB_DIALECT)) {
    logger.fatal("Invalid Dialect");
    process.exit(1);
}

// Function for retrieving the default database prot
const getDefaultDatabasePort = (dialect: Dialect): number => {
    switch (dialect) {
        case 'mysql':
        case 'mariadb':
            return 3306;
        case 'postgres':
            return 5432;
        default:
            throw new Error(`Dialect ${dialect} not supported.`);
    }
}

// Generate parameters
const sequelizeParams: Options = NATTER_DB_DIALECT === 'sqlite' ? {
    dialect: 'sqlite',
    storage: NATTER_DB_HOST
} : {
    dialect: NATTER_DB_DIALECT as Dialect,
    database: NATTER_DB_DATABASE,
    username: NATTER_DB_USERNAME,
    password: NATTER_DB_PASSWORD,
    host: NATTER_DB_HOST,
    port: NATTER_DB_PORT ? Number(NATTER_DB_PORT) : getDefaultDatabasePort(NATTER_DB_DIALECT as Dialect)
}

// Create connection
const sequelize = new Sequelize(sequelizeParams);

// Test authentication
sequelize.authenticate().catch(err => {
    logger.fatal("Failed to authenticate database", err);
    process.exit(1);
});

// Definitions
export const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Sync database
sequelize.sync().then(() => {
    logger.info("Database Sync Completed");
}).catch(err => {
    logger.fatal("Database Sync Failed");
    process.exit(1);
});

export default sequelize;