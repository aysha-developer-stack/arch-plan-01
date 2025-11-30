/**
 * Creates a new admin user in Supabase
 * @param email Admin email
 * @param password Admin password
 * @param name Admin name
 * @returns The created admin user or an error
 */
export declare function createAdmin(email: string, password: string, name: string): Promise<any>;
/**
 * Authenticates an admin user
 * @param email Admin email
 * @param password Admin password
 * @returns The authenticated admin user or an error
 */
export declare function authenticateAdmin(email: string, password: string): Promise<{
    admin: {
        id: string;
        email: string | undefined;
        name: any;
    };
    session: import("@supabase/auth-js").Session;
}>;
/**
 * Gets all admins
 * @returns A list of all admins
 */
export declare function getAllAdmins(): Promise<any[]>;
/**
 * Gets an admin by ID
 * @param id Admin ID
 * @returns The admin or null if not found
 */
export declare function getAdminById(id: string): Promise<any>;
/**
 * Deletes an admin
 * @param id Admin ID
 * @returns True if successful, false otherwise
 */
export declare function deleteAdmin(id: string): Promise<boolean>;
//# sourceMappingURL=adminService.d.ts.map