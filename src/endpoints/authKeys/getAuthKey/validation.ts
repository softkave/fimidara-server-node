import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getAppointmentsJoiSchema = Joi.object()
    .keys({
        shopId: validationSchemas.nanoid.required(),
    })
    .required();
