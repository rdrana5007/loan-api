import Customer from "../customer/customer.model";
import CustomerDocuments from "./customerDocuments.model";

// Customer associations
Customer.hasOne(CustomerDocuments, { foreignKey: 'customerId', as: 'customer_documents' });
CustomerDocuments.belongsTo(Customer, { foreignKey: 'customerId', as: 'customers' });

export { CustomerDocuments };