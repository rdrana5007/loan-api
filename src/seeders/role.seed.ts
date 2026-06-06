import { Role } from "../models";

const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Manager' },
    { id: 3, name: 'Collector' },
    { id: 4, name: 'Customer' }
];

export const seedRoles = async () => {
    try {
        // Fetch all existing roles from DB
        const existingRoles = await Role.findAll();

        const newNames = roles.map((r) => r.name);

        // Delete roles not in the new list
        for (const existingRole of existingRoles) {
            if (!newNames.includes(existingRole.name)) {
                await existingRole.destroy();
                console.log(`Role '${existingRole.name}' deleted.`);
            }
        }

        // Create or update roles in the list
        for (const roleData of roles) {
            const [role, created] = await Role.findOrCreate({
                where: { name: roleData.name },
                defaults: roleData
            });

            if (created) {
                console.log(`Role '${role.name}' created.`);
            } else {
                console.log(`Role '${role.name}' already exists.`);
            }
        }

        console.log('Roles synchronization completed.');
    } catch (error) {
        console.error('Error seeding roles:', error);
    }
};