import {getDateString} from '../../utilities/dateFns';
import {getFields, makeExtract, makeListExtract} from '../../utilities/extract';
import {IPublicAppointment} from './types';

const appointmentFields = getFields<IPublicAppointment>({
    appointmentId: true,
    shopId: true,
    customerName: true,
    customerPhone: true,
    time: true,
    cancelled: true,
    createdAt: getDateString,
    createdBy: true,
    lastUpdatedAt: getDateString,
});

export const appointmentExtractor = makeExtract(appointmentFields);
export const appointmentListExtractor = makeListExtract(appointmentFields);
