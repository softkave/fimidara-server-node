import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const addOrganizationJoiSchema = Joi.object()
  .keys({
    name: validationSchemas.name.required(),
    description: validationSchemas.description.allow(null),
  })
  .required();
