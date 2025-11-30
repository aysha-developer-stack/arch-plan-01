import { Request, Response, NextFunction } from 'express';
interface IAppUser {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    [key: string]: any;
}
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            appUser?: IAppUser;
        }
    }
}
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare const _default: {
    authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
};
export default _default;
//# sourceMappingURL=userAuthMiddleware.d.ts.map