import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {EmailAddressNotAvailableError} from '../errors';
import {SignupEndpoint} from './types';
import {signupJoiSchema} from './validation';
import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {IUser} from '../../../definitions/user';
import {userExtractor} from '../utils';
import {
    CURRENT_USER_TOKEN_VERSION,
    JWTEndpoint,
} from '../../contexts/UserTokenContext';

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
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: now,
        passwordLastChangedAt: now,
        isEmailVerified: false,
        orgs: [],
    };

    const user = await context.user.saveUser(context, value);
    const token = await context.userToken.saveToken(context, {
        tokenId: getNewId(),
        userId: user.userId,
        audience: [JWTEndpoint.Login],
        issuedAt: getDateString(),
        version: CURRENT_USER_TOKEN_VERSION,
    });

    instData.userTokenData = token;
    await context.sendEmailVerificationCode(instData);

    return {
        user: userExtractor(user),
        token: context.userToken.encodeToken(context, token.tokenId),
    };
};

export default signup;
