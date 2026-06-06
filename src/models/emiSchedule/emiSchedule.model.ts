import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config";

// Generated automatically when loan active.

interface EmiScheduleAttributes {
    id: number;
    loanId: number;
    installmentNo: number; // 1 2 3 4 5
    emiScheduleAmount: number; // EmiSchedule = ₹11,000
    principalAmount: number; // Principal = ₹10,000
    interestAmount: number; // Interest = ₹1,000
    paidAmount: number; // Customer Paid = ₹11,000 (Full payment) / Customer Paid = ₹7,000 (Partial payment)
    balanceAmount: number; // balance_amount = 0 (Full payment) / balance_amount = 4000 (Partial payment)
    status: string;
    dueDate: Date;
    paidDate: Date | null;
};

interface EmiScheduleCreationAttributes extends Optional<EmiScheduleAttributes, 'id' | 'status' | 'paidAmount' | 'balanceAmount' | 'paidDate'> {};

class EmiSchedule extends Model<EmiScheduleAttributes, EmiScheduleCreationAttributes> {
    declare id: number;
    declare loanId: number;
    declare installmentNo: number;
    declare emiScheduleAmount: number;
    declare principalAmount: number;
    declare interestAmount: number;
    declare paidAmount: number;
    declare balanceAmount: number;
    declare status: string;
    declare dueDate: Date;
    declare paidDate: Date | null;
};

EmiSchedule.init(
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
        installmentNo: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        emiScheduleAmount: {
            type: DataTypes.DECIMAL(10, 2),
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
            type: DataTypes.ENUM('pending', 'paid', 'partial', 'overdue'),
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
        modelName: 'EmiSchedule',
        tableName: 'emi_schedules',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default EmiSchedule;