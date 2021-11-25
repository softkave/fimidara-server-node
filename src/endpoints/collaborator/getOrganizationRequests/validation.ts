import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const newOrganizationJoiSchema = Joi.object().keys({
  name: validationSchemas.name.required(),
  description: validationSchemas.description,
});

export const addOrganizationJoiSchema = Joi.object()
  .keys({
    organization: newOrganizationJoiSchema.required(),
  })
  .required();
