import {isAfter, addMinutes} from 'date-fns';
import {
    UserDoesNotExistError,
    EmailAddressVerifiedError,
    VerificationCodeExpiredError,
    VerificationCodeInvalidError,
} from '../errors';
import {ConfirmEmailAddressEndpoint} from './types';
import {getDateString} from '../../../utilities/dateFns';
import AccessToken from '../../AccessToken';
import {JWTEndpoints} from '../../types';
import {userExtractor} from '../utils';
import {InvalidRequestError} from '../../errors';
import {userConstants} from '../constants';
import {validate} from '../../../utilities/validate';
import {confirmEmailAddressJoiSchema} from './validation';

const confirmEmailAddress: ConfirmEmailAddressEndpoint = async (
    context,
    instData
) => {
    const user = await context.session.getUser(context, instData);
    const data = validate(instData.data, confirmEmailAddressJoiSchema);

    if (user.isEmailVerified) {
        throw new EmailAddressVerifiedError();
    }

    if (!user.emailVerificationCode || !user.emailVerificationCodeSentAt) {
        // TODO: is this the right error?
        throw new InvalidRequestError();
    }

    const isCodeExpired = isAfter(
        new Date(),
        addMinutes(
            new Date(user.emailVerificationCodeSentAt),
            userConstants.emailVerificationCodeExpirationDurationInMins
        )
    );

    if (isCodeExpired) {
        throw new VerificationCodeExpiredError();
    }

    if (data.code !== user.emailVerificationCode) {
        throw new VerificationCodeInvalidError();
    }

    const updatedUser = await context.user.updateUserById(
        context,
        user.userId,
        {
            isEmailVerified: true,
            emailVerifiedAt: getDateString(),
            emailVerificationCode: null,
            emailVerificationCodeSentAt: null,
        }
    );

    if (!updatedUser) {
        throw new UserDoesNotExistError();
    }

    return {
        user: userExtractor(updatedUser),
        token: AccessToken.newUserToken({
            user: updatedUser,
            audience: [JWTEndpoints.Login],
        }),
    };
};

export default confirmEmailAddress;
