import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface CustomerDocumentsAttributes {
    id: number;
    customerId: number;
    aadhaarNumber?: string | null;
    panNumber?: string | null;
    aadhaarFile?: string | null;
    panFile?: string | null;
    verificationStatus: string;
    remarks?: string | null;
};

interface CustomerDocumentsCreationAttributes extends Optional<CustomerDocumentsAttributes, 'id' | 'aadhaarNumber' | 'panNumber' | 'aadhaarFile' | 'panFile' | 'verificationStatus' | 'remarks'> {};

class CustomerDocuments extends Model<CustomerDocumentsAttributes, CustomerDocumentsCreationAttributes> {
    declare id: number;
    declare customerId: number;
    declare aadhaarNumber?: string | null;
    declare panNumber?: string | null;
    declare aadhaarFile?: string | null;
    declare panFile?: string | null;
    declare verificationStatus: string;
    declare remarks?: string | null;
};

CustomerDocuments.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        customerId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'customers', key: 'id' },
            allowNull: false
        },
        aadhaarNumber: {
            type: new DataTypes.STRING
        },
        panNumber: {
            type: new DataTypes.STRING
        },
        aadhaarFile: {
            type: new DataTypes.STRING
        },
        panFile: {
            type: new DataTypes.STRING
        },
        verificationStatus: {
            type: new DataTypes.ENUM('pending', 'verified', 'rejected'),
            defaultValue: 'pending'
        },
        remarks: {
            type: new DataTypes.TEXT
        }
    },
    {
        sequelize,
        modelName: 'CustomerDocuments',
        tableName: 'customer_documents',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default CustomerDocuments;