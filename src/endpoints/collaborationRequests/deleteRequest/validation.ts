import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const deleteCollaborationRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
  })
  .required();
