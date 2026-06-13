import { User } from "../../user";
import { Counterparty } from "../counterparty";
import Borrowing from "./borrowing.model";

// Counterparty associations
Counterparty.hasMany(Borrowing, { foreignKey: 'counterpartyId', as: 'borrowings' });
Borrowing.belongsTo(Counterparty, { foreignKey: 'counterpartyId', as: 'counterparties' });

// User (Admin, Manager) associations
User.hasMany(Borrowing, { foreignKey: 'createdBy', as: 'borrowings' });
Borrowing.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });
Borrowing.belongsTo(User, { foreignKey: 'approvedBy', as: 'approved_by' });

export { Borrowing };