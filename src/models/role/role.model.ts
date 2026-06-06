import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config/db";

interface RoleAttributes {
    id: number;
    name: string;
};

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id'> {};

class Role extends Model<RoleAttributes, RoleCreationAttributes> {
    declare id: number;
    declare name: string;
};

Role.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: new DataTypes.STRING(128),
            allowNull: false,
            unique: true
        }
    },
    {
        sequelize,
        modelName: 'Role',
        tableName: 'roles',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Role;