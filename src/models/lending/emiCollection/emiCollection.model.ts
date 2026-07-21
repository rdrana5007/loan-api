import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

// Collector records collections.

interface EmiCollectionAttributes {
    id: number;
    loanId: number;
    customerId: number;
    collectorId: number;
    totalAmount: number;
    paymentMethod: string;
    transactionReference: string; // CASH-2026-1001, UPI123456789, NEFT987654321, CHQ001254
    remarks?: string;
};

interface EmiCollectionCreationAttributes extends Optional<EmiCollectionAttributes, 'id' | 'paymentMethod' | 'remarks'> {};

class EmiCollection extends Model<EmiCollectionAttributes, EmiCollectionCreationAttributes> {
    declare id: number;
    declare loanId: number;
    declare customerId: number;
    declare collectorId: number;
    declare totalAmount: number;
    declare paymentMethod: string;
    declare transactionReference: string;
    declare remarks?: string | null;
};

EmiCollection.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        loanId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'loans', key: 'id' },
            allowNull: false
        },
        customerId : {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'customers', key: 'id' },
            allowNull: false
        },
        collectorId : {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'upi', 'bank', 'cheque'),
            allowNull: false,
            defaultValue: 'cash'
        },
        transactionReference: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        remarks: {
            type: new DataTypes.TEXT
        }
    },
    {
        sequelize,
        modelName: 'EmiCollection',
        tableName: 'emi_collections',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default EmiCollection;