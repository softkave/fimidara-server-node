import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const addTagJoiSchema = Joi.object()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    tag: Joi.object()
      .keys({
        name: kValidationSchemas.name.required(),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
