import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const organizationExistsJoiSchema = Joi.object()
    .keys({
        name: validationSchemas.name.lowercase().required(),
    })
    .required();
