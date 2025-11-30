interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<void>;
    sendApprovalEmail(userEmail: string, userName: string): Promise<void>;
    sendRejectionEmail(userEmail: string, userName: string, rejectionReason: string): Promise<void>;
}
declare const _default: EmailService;
export default _default;
//# sourceMappingURL=emailService.d.ts.map