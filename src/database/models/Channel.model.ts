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
import Server from "./Server.model";
import UserChannelOverride from "./UserChannelOverride.model";

@Table
class Channel extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Column(DataTypes.ENUM("text", "voice"))
    type: string;

    @AllowNull(false)
    @Column(DataTypes.JSON)
    defaultPermissions: object;

    @ForeignKey(() => Server)
    @Column(DataTypes.UUID)
    serverUuid: string;

    @BelongsTo(() => Server)
    server: Server;

    @HasMany(() => UserChannelOverride)
    userOverrides: UserChannelOverride[];
}

export default Channel;
