import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import userValidationSchemas from '../../user/validation';
import {collabRequestConstants} from '../constants';
import {ICollaborationRequestInput} from './types';

export const requestJoiSchema = Joi.object().keys({
    recipientEmail: userValidationSchemas.email.required(),
    message: validationSchemas.description,
    expiresAt: validationSchemas.fromNowSecs,
});

export const sendRequestsJoiSchema = Joi.object()
    .keys({
        organizationId: validationSchemas.nanoid.required(),
        requests: Joi.array()
            .items(requestJoiSchema.required())
            .min(0)
            .max(collabRequestConstants.maxNewRequests)
            .unique(
                (
                    a: ICollaborationRequestInput,
                    b: ICollaborationRequestInput
                ) => a.recipientEmail === b.recipientEmail
            )
            .required(),
    })
    .required();
