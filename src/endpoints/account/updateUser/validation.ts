import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import userValidationSchemas from '../validation';

export const updateUserJoiSchema = Joi.object()
    .keys({
        firstName: userValidationSchemas.name.optional(),
        lastName: userValidationSchemas.name.optional(),
        phone: validationSchemas.phone,
        email: userValidationSchemas.email,
    })
    .required();
