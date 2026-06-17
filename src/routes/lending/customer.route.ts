import { Router } from "express";
import { createCustomer, deleteCustomer, getAllCustomer, getCustomer, updateCustomer } from "../../controllers";
import { createCustomerSchema, getAllCustomerSchema, idParamSchema, updateCustomerSchema } from "../../validations";
import { isManager, multiFileUploadMiddleware } from "../../middlewares";

const router: Router = Router();

// Create customer
router.post('/', multiFileUploadMiddleware([
    { name: 'profile', fileType: 'image', storagePath: 'profile' },
    { name: 'aadhaar', fileType: 'image', storagePath: 'aadhaarCard' },
    { name: 'pan', fileType: 'image', storagePath: 'panCard' }
]), isManager, createCustomerSchema, createCustomer);

// Get all customer
router.get('/', isManager, getAllCustomerSchema, getAllCustomer);

// Get customer by id
router.get('/:id', isManager, idParamSchema, getCustomer);

// Update customer by id
router.patch('/:id', multiFileUploadMiddleware([
    { name: 'profile', fileType: 'image', storagePath: 'profile' },
    { name: 'aadhaar', fileType: 'image', storagePath: 'aadhaarCard' },
    { name: 'pan', fileType: 'image', storagePath: 'panCard' }
]), isManager, updateCustomerSchema, updateCustomer);

// Delete customer by id
router.delete('/:id', isManager, deleteCustomer);

export default router;