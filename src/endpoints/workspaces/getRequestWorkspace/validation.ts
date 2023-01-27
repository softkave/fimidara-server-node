import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getRequestWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId.required(),
  })
  .required();
