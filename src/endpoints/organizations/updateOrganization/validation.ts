import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const organizationInputJoiSchema = Joi.object().keys({
    name: validationSchemas.name,
    description: validationSchemas.description,
});

export const updateOrganizationJoiSchema = Joi.object()
    .keys({
        organizationId: validationSchemas.nanoid.required(),
        data: organizationInputJoiSchema.required(),
    })
    .required();
