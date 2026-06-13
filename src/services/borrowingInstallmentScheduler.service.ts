import { Op, Sequelize } from "sequelize";
import { sequelize } from "../config";
import { Borrowing, BorrowingInstallment } from "../models";

// Auto scheduler function for Borrowing Installment
export const autoBorrowingInstallmentScheduler = async () => {
    const today: Date = new Date();
    const defaultThreshold: number = 3;

    const t = await sequelize.transaction();

    try {
        await BorrowingInstallment.update(
            { status: 'overdue' },
            {
                where: {
                    borrowingId: {
                        [Op.in]: Sequelize.literal(`
                            (SELECT id FROM borrowings WHERE status = 'active')
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
    
        await Borrowing.update(
            {
                status: 'defaulted'
            },
            {
                where: {
                    status: 'active',
                    id: {
                        [Op.in]: Sequelize.literal(`
                        (
                            SELECT borrowing_id
                            FROM borrowing_installments
                            WHERE status = 'overdue'
                            GROUP BY borrowing_id
                            HAVING COUNT(*) >= ${defaultThreshold}
                        )
                    `)
                    }
                },
                transaction: t
            }
        );
    
        await t.commit();
        console.log('Auto borrowing installment scheduler executed successfully');
    } catch (error) {
        await t.rollback();
        throw error;
    }
};