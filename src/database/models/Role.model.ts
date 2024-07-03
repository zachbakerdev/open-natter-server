import { DataTypes } from "sequelize";
import {
    AllowNull,
    Column,
    Default,
    Model,
    PrimaryKey,
    Table,
} from "sequelize-typescript";

@Table
class Role extends Model {
    @Default(DataTypes.UUIDV4)
    @AllowNull(false)
    @PrimaryKey
    @Column(DataTypes.UUID)
    uuid: string;

    @AllowNull(false)
    @Column(DataTypes.INTEGER)
    defaultPermissions: number;
}

export default Role;
