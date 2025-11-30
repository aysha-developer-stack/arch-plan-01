import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            adminId?: string;
        }
    }
}
export declare const authenticateAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    authenticateAdmin: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=authMiddleware.d.ts.map