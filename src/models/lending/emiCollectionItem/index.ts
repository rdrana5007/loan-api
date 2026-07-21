import { EmiCollection } from "../emiCollection";
import { EmiSchedule } from "../emiSchedule";
import EmiCollectionItem from "./emiCollectionItem.model";

// EmiCollection associations
EmiCollection.hasMany(EmiCollectionItem, { foreignKey: 'emiCollectionId', as: 'emi_collection_items' });
EmiCollectionItem.belongsTo(EmiCollection, { foreignKey: 'emiCollectionId', as: 'emi_collections' });

// EmiSchedule associations
EmiSchedule.hasMany(EmiCollectionItem, { foreignKey: 'emiScheduleId', as: 'emi_collection_items' });
EmiCollectionItem.belongsTo(EmiSchedule, { foreignKey: 'emiScheduleId', as: 'emi_schedules' });

export { EmiCollectionItem };