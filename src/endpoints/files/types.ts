export interface IPublicAppointment {
    appointmentId: string;
    shopId: string;
    customerName: string;
    customerPhone: string;
    time: string;
    cancelled?: boolean;
    createdAt: string;
    createdBy: string;
    lastUpdatedAt?: string;
}
