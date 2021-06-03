import {validate} from '../../../utilities/validate';
import {PermissionDeniedError} from '../../user/errors';
import {authKeyListExtractor} from '../utils';
import {GetAppointmentsEndpoint} from './types';
import {getAppointmentsJoiSchema} from './validation';

const getAppointments: GetAppointmentsEndpoint = async (context, instData) => {
    const data = validate(instData.data, getAppointmentsJoiSchema);
    const user = await context.session.getUser(context, instData);
    const shop = await context.shop.assertGetShopById(context, data.shopId);

    if (shop.createdBy !== user.userId) {
        throw new PermissionDeniedError();
    }

    const appointments = await context.appointment.getAppointmentsByShopId(
        context,
        data.shopId
    );

    return {
        appointments: authKeyListExtractor(appointments),
    };
};

export default getAppointments;
