import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const revokeRequestJoiSchema = Joi.object()
  .keys({
    requestId: validationSchemas.resourceId.required(),
  })
  .required();
