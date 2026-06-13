import { Op, Sequelize } from "sequelize";
import { sequelize } from "../config";
import { EmiSchedule, Loan } from "../models";

// Auto scheduler function for Emi Scheduler
export const autoEmiScheduler = async () => {
    const today: Date = new Date();
    const defaultThreshold: number = 3;

    const t = await sequelize.transaction();

    try {
        await EmiSchedule.update(
            { status: 'overdue' },
            {
                where: {
                    loanId: {
                        [Op.in]: Sequelize.literal(`
                            (SELECT id FROM loans WHERE status = 'active')
                        `)
                    },
                    status: {
                        [Op.in]: ['pending', 'partial']
                    },
                    dueDate: {
                        [Op.lt]: today
                    },
                    balanceAmount: {
                        [Op.gt]: 0
                    }
                },
                transaction: t
            }
        );
    
        await Loan.update(
            {
                status: 'defaulted',
                defaultReason: '3+ EMIs overdue',
                defaultedAt: today
            },
            {
                where: {
                    status: 'active',
                    id: {
                        [Op.in]: Sequelize.literal(`
                        (
                            SELECT loan_id
                            FROM emi_schedules
                            WHERE status = 'overdue'
                            GROUP BY loan_id
                            HAVING COUNT(*) >= ${defaultThreshold}
                        )
                    `)
                    }
                },
                transaction: t
            }
        );
    
        await t.commit();
        console.log('Auto emi scheduler executed successfully');
    } catch (error) {
        await t.rollback();
        throw error;
    }
};