import { Role } from "../role";
import User from "./user.model";

// Role associations
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roles' });

export { User };