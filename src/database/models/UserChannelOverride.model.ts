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
import Channel from "./Channel.model";
import User from "./User.model";

@Table
class UserChannelOverride extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Column(DataTypes.INTEGER)
    permissionsMask: number;

    @AllowNull(false)
    @Column(DataTypes.INTEGER)
    permissionsAdditional: number;

    @ForeignKey(() => Channel)
    @Column(DataTypes.UUID)
    channelUuid: string;

    @BelongsTo(() => Channel)
    channel: Channel;

    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    userUuid: string;

    @BelongsTo(() => User)
    user: User;
}

export default UserChannelOverride;
