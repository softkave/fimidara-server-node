import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';

export const getUserCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: kValidationSchemas.resourceId.required(),
  })
  .required();
