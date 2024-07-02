import { DataTypes } from "sequelize";
import {
    AllowNull,
    BelongsToMany,
    Column,
    Default,
    HasMany,
    IsEmail,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from "sequelize-typescript";
import AuditLogEntry from "./AuditLogEntry.model";
import ForgotPassword from "./ForgotPassword.model";
import Role from "./Role.model";
import Server from "./Server.model";
import UserChannelOverride from "./UserChannelOverride.model";
import UserRoleAssignment from "./UserRoleAssignment.model";
import UserVerificationEmail from "./UserVerificationEmail.model";

@Table
class User extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Unique
    @Column(DataTypes.STRING)
    username: string;

    @AllowNull(false)
    @Unique
    @IsEmail
    @Column(DataTypes.STRING)
    email: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    email_verified: boolean;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    two_factor_authentication_enabled: boolean;

    @Column(DataTypes.TEXT)
    two_factor_authentication_secret: string | null;

    @AllowNull(false)
    @Column(DataTypes.STRING)
    password: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    isSystemAdmin: boolean;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    canCreateServers: boolean;

    @HasMany(() => AuditLogEntry, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    auditLogEntries: AuditLogEntry[];

    @HasMany(() => Server, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    servers: Server[];

    @HasMany(() => UserChannelOverride, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    channelOverrides: UserChannelOverride[];

    @BelongsToMany(() => Role, () => UserRoleAssignment)
    roles: Role[];

    @HasMany(() => UserVerificationEmail, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    verificationEmails: UserVerificationEmail[];

    @HasMany(() => ForgotPassword, {
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
    })
    forgotPasswords: ForgotPassword[];
}

export default User;
