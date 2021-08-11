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

    await context.session.updateUser(context, instData, update);
};

export default updateUser;
