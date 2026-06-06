import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config";

interface LoanAttributes {
    id: number;
    customerId: number;
    collectorId: number;
    createdBy: number;
    updatedBy?: number | null;
    approvedBy?: number | null;
    rejectedBy?: number | null;
    closedBy?: number | null;
    loanNumber: string; // 1234560002
    loanAmount: number;
    interestRate: number;
    tenureMonths: number; // Loan duration
    processingFee: number;
    disbursedAmount?: number;
    status: string;
    notes?: string | null;
    rejectionReason?: string | null; // Poor credit history, Invalid documents, Customer not eligible, Fraud suspicion
    defaultReason?: string | null; // 120 days overdue (By System)
    startDate: Date;
    endDate: Date;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    disbursedAt: Date | null;
    closedAt: Date | null;
    defaultedAt: Date | null;
};

interface LoanCreationAttributes extends Optional<
    LoanAttributes,
    'id' | 'updatedBy' | 'approvedBy' | 'rejectedBy' | 'closedBy' | 'disbursedAmount' | 'status' | 'notes' | 'rejectionReason' | 'defaultReason' | 'approvedAt' | 'rejectedAt' | 'disbursedAt' | 'closedAt' | 'defaultedAt'
> {};

class Loan extends Model<LoanAttributes, LoanCreationAttributes> {
    declare id: number;
    declare customerId: number;
    declare collectorId: number;
    declare createdBy: number;
    declare updatedBy?: number | null;
    declare approvedBy?: number | null;
    declare rejectedBy?: number | null;
    declare closedBy?: number | null;
    declare loanNumber: string;
    declare loanAmount: number;
    declare interestRate: number;
    declare tenureMonths: number;
    declare processingFee: number;
    declare disbursedAmount?: number;
    declare status: string;
    declare notes?: string | null;
    declare rejectionReason?: string | null;
    declare defaultReason?: string | null;
    declare startDate: Date;
    declare endDate: Date;
    declare approvedAt: Date | null;
    declare rejectedAt: Date | null;
    declare disbursedAt: Date | null;
    declare closedAt: Date | null;
    declare defaultedAt: Date | null;
};

Loan.init(
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
        collectorId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        createdBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' },
            allowNull: false
        },
        updatedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        approvedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        rejectedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        closedBy: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'users', key: 'id' }
        },
        loanNumber: {
            type: new DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        loanAmount: {
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
        processingFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        disbursedAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'active', 'closed', 'defaulted'),
            allowNull: false,
            defaultValue: 'pending'
        },
        notes: {
            type: new DataTypes.TEXT
        },
        rejectionReason: {
            type: new DataTypes.TEXT
        },
        defaultReason: {
            type: new DataTypes.TEXT
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
        },
        rejectedAt: {
            type: DataTypes.DATE
        },
        disbursedAt: {
            type: DataTypes.DATE
        },
        closedAt: {
            type: DataTypes.DATE
        },
        defaultedAt: {
            type: DataTypes.DATE
        }
    },
    {
        sequelize,
        modelName: 'Loan',
        tableName: 'loans',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default Loan;



// | Status    | Meaning                                  |
// | --------- | ---------------------------------------- |
// | pending   | Application submitted, waiting approval  |
// | approved  | Manager approved but money not yet given |
// | active    | Money disbursed, EMI running             |
// | closed    | Loan fully paid                          |
// | defaulted | Customer stopped paying                  |
// | rejected  | Application rejected                     |


// 3 consecutive unpaid EMIs
// OR
// 90 days overdue

// Loan Status = defaulted