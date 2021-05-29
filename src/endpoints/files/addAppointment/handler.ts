import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {appointmentExtractor} from '../utils';
import {AddAppointmentEndpoint} from './types';
import {addAppointmentJoiSchema} from './validation';

const addAppointment: AddAppointmentEndpoint = async (context, instData) => {
    const data = validate(instData.data, addAppointmentJoiSchema);
    const user = await context.session.tryGetUser(context, instData);
    const appointment = await context.appointment.saveAppointment(context, {
        appointmentId: getNewId(),
        shopId: data.shopId,
        customerName: data.appointment.customerName,
        customerPhone: data.appointment.customerPhone,
        time: data.appointment.time,
        createdAt: getDateString(),
        createdBy: user?.userId || data.appointment.customerPhone,
    });

    const publicData = appointmentExtractor(appointment);
    return {
        appointment: publicData,
    };
};

export default addAppointment;
