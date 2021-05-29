import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {canReadOrganization} from '../../organizations/utils';
import {authKeyConstants} from '../constants';
import {authKeyExtractor} from '../utils';
import {AddAuthKeyEndpoint} from './types';
import {addAuthKeyJoiSchema} from './validation';

const addAuthKey: AddAuthKeyEndpoint = async (context, instData) => {
    const data = validate(instData.data, addAuthKeyJoiSchema);
    const user = await context.session.getUser(context, instData);
    const org = await context.organization.assertGetOrganizationById(
        context,
        data.organizationId
    );

    canReadOrganization(user, org);

    const publicKey = getNewId(authKeyConstants.authIdLength);
    const authToken = getNewId(authKeyConstants.authTokenLength);
    const hash = await argon2.hash(authToken);
    const authKey = await context.authKey.saveAuthKey(context, {
        authId: publicKey,
        hash,
        organizationId: org.organizationId,
        createdAt: getDateString(),
        createdBy: user.userId,
    });

    const publicData = authKeyExtractor({
        ...authKey,
        authToken,
    });

    return {
        authKey: publicData,
    };
};

export default addAuthKey;
