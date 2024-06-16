import { DataTypes } from "sequelize";
import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    ForeignKey,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import AuditLogEntry from "./AuditLogEntry.model";
import Channel from "./Channel.model";
import User from "./User.model";

@Table
class Server extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    ownerUuid: string;

    @HasMany(() => AuditLogEntry)
    auditLogEntries: AuditLogEntry[];

    @HasMany(() => Channel)
    channels: Channel[];

    @BelongsTo(() => User)
    owner: User;
}

export default Server;
