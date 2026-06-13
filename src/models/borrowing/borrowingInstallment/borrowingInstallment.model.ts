import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface BorrowingInstallmentAttributes {
    id: number;
    borrowingId: number;
    installmentNo: number; // 1 2 3 4 5
    principalAmount: number; // Principal = ₹10,000
    interestAmount: number; // Interest = ₹1,000
    totalAmount: number; // BorrowingInstallment = ₹11,000
    paidAmount: number; // Customer Paid = ₹11,000 (Full payment) / Customer Paid = ₹7,000 (Partial payment)
    balanceAmount: number; // balance_amount = 0 (Full payment) / balance_amount = 4000 (Partial payment)
    status: string;
    dueDate: Date;
    paidDate?: Date | null;
};

interface BorrowingInstallmentCreationAttributes extends Optional<BorrowingInstallmentAttributes, 'id' | 'paidAmount' | 'balanceAmount' | 'status' | 'paidDate'> {};

class BorrowingInstallment extends Model<BorrowingInstallmentAttributes, BorrowingInstallmentCreationAttributes> {
    declare id: number;
    declare borrowingId: number;
    declare installmentNo: number;
    declare principalAmount: number;
    declare interestAmount: number;
    declare totalAmount: number;
    declare paidAmount: number;
    declare balanceAmount: number;
    declare status: string;
    declare dueDate: Date;
    declare paidDate?: Date | null;
};

BorrowingInstallment.init(
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
        installmentNo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        principalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        interestAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        paidAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        balanceAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending', 'partial', 'paid', 'overdue'),
            allowNull: false,
            defaultValue: 'pending'
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        paidDate: {
            type: DataTypes.DATE
        }
    },
    {
        sequelize,
        modelName: 'BorrowingInstallment',
        tableName: 'borrowing_installments',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default BorrowingInstallment;