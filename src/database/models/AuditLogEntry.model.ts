import { DataTypes } from "sequelize";
import {
    AllowNull,
    BelongsTo,
    Column,
    Default,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";
import Server from "./Server.model";
import User from "./User.model";

@Table
class AuditLogEntry extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Column(DataTypes.TEXT)
    msg: string;

    @ForeignKey(() => Server)
    @Column(DataTypes.UUID)
    serverUuid: string;

    @BelongsTo(() => Server)
    server: Server;

    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    userUuid: string;

    @BelongsTo(() => User)
    user: User;
}

export default AuditLogEntry;
