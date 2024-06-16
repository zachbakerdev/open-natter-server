import { DataTypes } from "sequelize";
import {
    AllowNull,
    Column,
    Default,
    IsEmail,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";

@Table
export default class Registration extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @IsEmail
    @Column(DataTypes.STRING)
    email: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataTypes.BOOLEAN)
    admin: boolean;
}
