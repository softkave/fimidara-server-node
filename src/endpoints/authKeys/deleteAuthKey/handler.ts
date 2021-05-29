import {IAppointment} from '../../../definitions/appointment';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import {IBaseUserTokenData} from '../../AccessToken';
import {InvalidRequestError} from '../../errors';
import RequestData from '../../RequestData';
import {AppointmentDoesNotExistError} from '../errors';
import {authKeyExtractor} from '../utils';
import {
    IUpdateAppointmentEndpointRequestToken,
    UpdateAppointmentEndpoint,
} from './types';
import {updateAppointmentJoiSchema} from './validation';

const updateAppointment: UpdateAppointmentEndpoint = async (
    context,
    instData
) => {
    const data = validate(instData.data, updateAppointmentJoiSchema);
    const user = await context.session.tryGetUser(
        context,
        instData as RequestData<any, IBaseUserTokenData>
    );
    const tokenData = context.session.tryGetRequestTokenData<IUpdateAppointmentEndpointRequestToken>(
        context,
        instData as RequestData<any, IUpdateAppointmentEndpointRequestToken>
    );

    if (!user && !tokenData) {
        if (!tokenData) {
            throw new InvalidRequestError({
                message: 'Credentials not provided',
            });
        }
    }

    let updatedAppointment: IAppointment | null = null;

    if (user) {
        updatedAppointment = await context.appointment.updateAppointmentByCreatorId(
            context,
            user.userId,
            data.appointmentId,
            {
                ...data.data,
                lastUpdatedAt: getDateString(),
                lastUpdatedBy: user.userId,
            }
        );
    } else if (tokenData) {
        updatedAppointment = await context.appointment.updateAppointmentByCustomerPhone(
            context,
            tokenData.customerPhone,
            data.appointmentId,
            {
                ...data.data,
                lastUpdatedAt: getDateString(),
                lastUpdatedBy: tokenData.customerPhone,
            }
        );
    }

    if (!updatedAppointment) {
        throw new ServerError();
    }

    if (!updatedAppointment) {
        throw new AppointmentDoesNotExistError();
    }

    return {appointment: authKeyExtractor(updatedAppointment)};
};

export default updateAppointment;
