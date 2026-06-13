import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface CounterpartyAttributes {
    id: number;
    createdBy: number;
    counterpartyCode: string;
    counterpartyType: string;
    name: string;
    companyName?: string | null;
    email?: string | null;                          
    phone: string;
    panNumber?: string | null;
    gstNumber?: string | null;
    address?: string | null;
    bankName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    isActive: boolean;
};                                                                                                                                                                                  

interface CounterpartyCreationAttributes extends Optional<
    CounterpartyAttributes,
    'id' | 'companyName' | 'email' | 'panNumber' | 'gstNumber' | 'address' | 'bankName' | 'accountNumber' | 'ifscCode' | 'isActive'
> {};

class Counterparty extends Model<CounterpartyAttributes, CounterpartyCreationAttributes> {
    declare id: number;
    declare createdBy: number;
    declare counterpartyCode: string;
    declare counterpartyType: string;
    declare name: string;
    declare companyName?: string | null;
    declare email?: string | null;
    declare phone: string;
    declare panNumber?: string | null;
    declare gstNumber?: string | null;
    declare address?: string | null;
    declare bankName?: string | null;
    declare accountNumber?: string | null;
    declare ifscCode?: string | null;
    declare isActive: boolean;
};

Counterparty.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        createdBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        counterpartyCode: {
            type: new DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        counterpartyType: {
            type: DataTypes.ENUM('investor', 'bank', 'NBFC', 'corporate', 'government'),
            allowNull: false
        },
        name: {
            type: new DataTypes.STRING(128),
            allowNull: false
        },
        companyName: {
            type: new DataTypes.STRING(128)
        },
        email: {
            type: new DataTypes.STRING(128),
            unique: true,
            validate: { isEmail: true }
        },
        phone: {
            type: new DataTypes.STRING(15),
            allowNull: false,
            unique: true
        },
        panNumber: {
            type: new DataTypes.STRING,
            unique: true
        },
        gstNumber: {
            type: new DataTypes.STRING
        },
        address: {
            type: new DataTypes.TEXT
        },
        bankName: {
            type: new DataTypes.STRING
        },
        accountNumber: {
            type: new DataTypes.STRING
        },
        ifscCode: {
            type: new DataTypes.STRING
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        sequelize,
        modelName: 'Counterparty',
        tableName: 'counterparties',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Counterparty;