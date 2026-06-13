import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../../config";

interface BorrowingAttributes {
    id: number;
    counterpartyId: number;
    createdBy: number;
    approvedBy?: number | null;
    borrowingNumber: string;
    principalAmount: number; // Principal = ₹1,00,000
    interestRate: number; // Interest Rate = 12%
    tenureMonths: number; // Borrowing duration, Tenure = 12 Months
    emiAmount: number;
    totalInterest: number; // totalInterest = 12000
    totalPayable: number; // totalPayable = principalAmount + totalInterest (totalPayable = ₹1,12,000)
    outstandingPrincipal: number; // outstandingPrincipal = 100000 (Principal Repaid = ₹20,000, Outstanding Principal = 1,00,000 - 20,000 = ₹80,000, outstandingPrincipal = 80000) (Loan Completed - outstandingPrincipal: 0)
    outstandingInterest: number; // outstandingInterest = 12000 (Interest Paid = ₹3,000, Outstanding Interest = 12,000 - 3,000 = ₹9,000, outstandingInterest = 9000) (Loan Completed - outstandingInterest: 0)
    status: string;
    startDate: Date;
    endDate: Date;
    approvedAt?: Date | null;
};

interface BorrowingCreationAttributes extends Optional<BorrowingAttributes, 'id' | 'approvedBy' | 'status' | 'approvedAt'> {};

class Borrowing extends Model<BorrowingAttributes, BorrowingCreationAttributes> {
    declare id: number;
    declare counterpartyId: number;
    declare createdBy: number;
    declare approvedBy?: number | null;
    declare borrowingNumber: string;
    declare principalAmount: number;
    declare interestRate: number;
    declare tenureMonths: number;
    declare emiAmount: number;
    declare totalInterest: number;
    declare totalPayable: number;
    declare outstandingPrincipal: number;
    declare outstandingInterest: number;
    declare status: string;
    declare startDate: Date;
    declare endDate: Date;
    declare approvedAt?: Date | null;

};

Borrowing.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        counterpartyId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'counterparties', key: 'id' },
            allowNull: false
        },
        createdBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        approvedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        borrowingNumber: {
            type: new DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        principalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        interestRate: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false
        },
        tenureMonths: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        emiAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        totalInterest: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        totalPayable: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        outstandingPrincipal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        outstandingInterest: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted'),
            allowNull: false,
            defaultValue: 'pending'
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        approvedAt: {
            type: DataTypes.DATE
        }
    },
    {
        sequelize,
        modelName: 'Borrowing',
        tableName: 'borrowings',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Borrowing;



// | Field                | Changes After Loan Creation? | Purpose                    |
// | -------------------- | ---------------------------- | -------------------------- |
// | principalAmount      | ❌ No                         | Original borrowed amount   |
// | interestRate         | ❌ No                         | Contractual interest rate  |
// | emiAmount            | ❌ Usually No                 | Monthly installment amount |
// | totalInterest        | ❌ No                         | Total interest for loan    |
// | totalPayable         | ❌ No                         | Principal + Interest       |
// | outstandingPrincipal | ✅ Yes                        | Remaining principal        |
// | outstandingInterest  | ✅ Yes                        | Remaining interest         |
