import Joi = require('joi');
import {validationSchemas} from '../../../utilities/validationUtils';

export const confirmPhoneNumberJoiSchema = Joi.object()
    .keys({
        code: validationSchemas.verificationCode.required(),
    })
    .required();
