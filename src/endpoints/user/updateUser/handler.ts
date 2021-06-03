import {IUser} from '../../../definitions/user';
import {getDateString} from '../../../utilities/dateFns';
import {validate} from '../../../utilities/validate';
import {UpdateUserEndpoint} from './types';
import {updateUserJoiSchema} from './validation';

const updateUser: UpdateUserEndpoint = async (context, instData) => {
    await context.session.assertUser(context, instData);
    const data = validate(instData.data, updateUserJoiSchema);
    const update: Partial<IUser> = {
        ...data,
        lastUpdatedAt: getDateString(),
    };

    if (data.email) {
        update.isEmailVerified = false;
        update.emailVerifiedAt = null;
    }

    if (data.phone) {
        update.isPhoneVerified = false;
        update.phoneVerifiedAt = null;
    }

    await context.session.updateUser(context, instData, update);

    // invalidate emailVerified and phoneVerified if the user updates these fields
};

export default updateUser;
