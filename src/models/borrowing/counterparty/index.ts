import { User } from "../../user";
import Counterparty from "./counterparty.model";

// User associations
User.hasMany(Counterparty, { foreignKey: 'createdBy', as: 'counterparties' });
Counterparty.belongsTo(User, { foreignKey: 'createdBy', as: 'created_by' });

export { Counterparty };