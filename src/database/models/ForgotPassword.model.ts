import { DataTypes } from "sequelize";
import { AllowNull, BelongsTo, Column, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "./User.model";

@Table
export default class ForgotPassword extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Column(DataTypes.STRING)
    code: string;

    @ForeignKey(() => User)
    @Column(DataTypes.UUID)
    userUuid: string;

    @BelongsTo(() => User)
    user: User;
}