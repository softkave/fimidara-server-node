import * as argon2 from 'argon2';
import {ServerError} from '../../../utilities/errors';
import {validate} from '../../../utilities/validate';
import AccessToken from '../../contexts/AccessToken';
import {JWTEndpoints} from '../../types';
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

    return {
        user: userExtractor(userData),
        token: AccessToken.newUserToken({
            user: userData,
            audience: [JWTEndpoints.Login],
        }),
    };
};

export default login;
