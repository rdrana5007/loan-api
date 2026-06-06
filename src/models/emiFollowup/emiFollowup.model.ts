import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../config";

// Collectors follow overdue customers.

interface EmiFollowupAttributes {
    id: number;
    emiScheduleId: number;
    loanId: number;
    customerId: number;
    collectorId: number;
    communicationType: string;
    status: string;
    followUpDate: Date;
    remarks: string;
    nextFollowupDate?: Date | null;
};

interface EmiFollowupCreationAttributes extends Optional<EmiFollowupAttributes, 'id' | 'status' | 'nextFollowupDate'> {};

class EmiFollowup extends Model<EmiFollowupAttributes, EmiFollowupCreationAttributes> {
    declare id: number;
    declare emiScheduleId: number;
    declare loanId: number;
    declare customerId: number;
    declare collectorId: number;
    declare communicationType: string;
    declare status: string;
    declare followUpDate: Date;
    declare remarks: string;
    declare nextFollowupDate?: Date | null;
};

EmiFollowup.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true
        },
        emiScheduleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            references: { model: 'emi_schedules', key: 'id' },
            allowNull: false
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
        communicationType: {
            type: DataTypes.ENUM('call', 'visit', 'sms', 'email', 'whatsapp'),
            allowNull: false,
            defaultValue: 'call'
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        remarks: {
            type: new DataTypes.TEXT,
            allowNull: false
        },
        followUpDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        nextFollowupDate: {
            type: DataTypes.DATE,
        }
    },
    {
        sequelize,
        modelName: 'EmiFollowup',
        tableName: 'emi_followups',
        timestamps: true,
        underscored: true,
        paranoid: true
    }
);

export default EmiFollowup;