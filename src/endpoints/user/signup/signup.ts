import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EmailAddressNotAvailableError} from '../errors';
import {SignupEndpoint} from './types';
import {signupJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {IUser} from '../../../definitions/user';
import {userExtractor} from '../utils';
import AccessToken from '../../contexts/AccessToken';
import {JWTEndpoints} from '../../types';

const signup: SignupEndpoint = async (context, instData) => {
    const data = validate(instData.data, signupJoiSchema);
    const userExists = await context.user.userExists(context, data.email);

    if (userExists) {
        throw new EmailAddressNotAvailableError();
    }

    const hash = await argon2.hash(data.password);
    const now = getDateString();
    const value: IUser = {
        hash,
        userId: getNewId(),
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: now,
        passwordLastChangedAt: now,
        isEmailVerified: false,
        isPhoneVerified: false,
    };

    const user = await context.user.saveUser(context, value);
    context.session.addUserToSession(context, instData, user);
    // await context.sendEmailVerificationCode(instData);

    return {
        user: userExtractor(user),
        token: AccessToken.newUserToken({
            user,
            audience: [JWTEndpoints.Login],
        }),
    };
};

export default signup;
