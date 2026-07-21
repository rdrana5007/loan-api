import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface EmiCollectionItemAttributes {
    id: number;
    emiCollectionId: number;
    emiScheduleId: number;
    amount: number;
};

interface EmiCollectionItemCreationAttributes extends Optional<EmiCollectionItemAttributes, 'id'> {};

class EmiCollectionItem extends Model<EmiCollectionItemAttributes, EmiCollectionItemCreationAttributes> {
    declare id: number;
    declare emiCollectionId: number;
    declare emiScheduleId: number;
    declare amount: number;
};

EmiCollectionItem.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        emiCollectionId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'emi_collections', key: 'id' },
            allowNull: false
        },
        emiScheduleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'emi_schedules', key: 'id' },
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'EmiCollectionItem',
        tableName: 'emi_collection_items',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default EmiCollectionItem;