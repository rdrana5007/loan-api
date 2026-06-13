import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface BorrowingPaymentAttributes {
    id: number;
    borrowingId: number;
    installmentId?: number | null;
    createdBy: number;
    amount: number;
    paymentMethod: string;
    transactionReference?: string | null; // CASH-2026-1001, UPI123456789, NEFT987654321, CHQ001254
    remarks?: string;
};

interface BorrowingPaymentCreationAttributes extends Optional<BorrowingPaymentAttributes, 'id' | 'paymentMethod' | 'transactionReference' | 'remarks'> {};

class BorrowingPayment extends Model<BorrowingPaymentAttributes, BorrowingPaymentCreationAttributes> {
    declare id: number;
    declare borrowingId: number;
    declare installmentId?: number | null;
    declare createdBy: number;
    declare amount: number;
    declare paymentMethod: string;
    declare transactionReference?: string | null;
    declare remarks?: string | null;
};

BorrowingPayment.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        borrowingId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'borrowings', key: 'id' },
            allowNull: false
        },
        installmentId : {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'borrowing_installments', key: 'id' }
        },
        createdBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        paymentMethod: {
            type: DataTypes.ENUM('cash', 'upi', 'bank', 'cheque'),
            allowNull: false,
            defaultValue: 'cash'
        },
        transactionReference: {
            type: new DataTypes.STRING(128)
        },
        remarks: {
            type: new DataTypes.TEXT
        }
    },
    {
        sequelize,
        modelName: 'BorrowingPayment',
        tableName: 'borrowing_payments',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default BorrowingPayment;