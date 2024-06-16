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
import Role from "./Role.model";
import User from "./User.model";

@Table
class UserRoleAssignment extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @ForeignKey(() => Role)
    @Column(DataTypes.UUID)
    roleUuid: string;

    @BelongsTo(() => Role)
    role: Role;

    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    userUuid: string;

    @BelongsTo(() => User)
    user: User;
}

export default UserRoleAssignment;
