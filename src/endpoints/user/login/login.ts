import * as argon2 from 'argon2';
import {getDateString} from '../../../utilities/dateFns';
import {ServerError} from '../../../utilities/errors';
import getNewId from '../../../utilities/getNewId';
import {validate} from '../../../utilities/validate';
import {
    JWTEndpoint,
    CURRENT_USER_TOKEN_VERSION,
} from '../../contexts/UserTokenContext';
import {InvalidEmailOrPasswordError} from '../errors';
import {userExtractor} from '../utils';
import {LoginEndpoint} from './types';
import {loginJoiSchema} from './validation';

const login: LoginEndpoint = async (context, instData) => {
    const data = validate(instData.data, loginJoiSchema);
    const userData = await context.user.getUserByEmail(context, data.email);

    if (!userData) {
        throw new InvalidEmailOrPasswordError();
    }

    let passwordMatch = false;

    try {
        passwordMatch = await argon2.verify(userData.hash, data.password);
    } catch (error) {
        console.error(error);
        throw new ServerError();
    }

    if (!passwordMatch) {
        throw new InvalidEmailOrPasswordError();
    }

    const token =
        (await context.userToken.getTokenByUserId(context, userData.userId)) ||
        (await context.userToken.saveToken(context, {
            tokenId: getNewId(),
            userId: userData.userId,
            audience: [JWTEndpoint.Login],
            issuedAt: getDateString(),
            version: CURRENT_USER_TOKEN_VERSION,
        }));

    instData.userTokenData = token;
    return {
        user: userExtractor(userData),
        token: context.userToken.encodeToken(context, token.tokenId),
    };
};

export default login;
