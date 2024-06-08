import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';

export const deleteCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: kValidationSchemas.resourceId.required(),
  })
  .required();
