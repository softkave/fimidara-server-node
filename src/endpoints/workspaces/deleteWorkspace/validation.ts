import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const deleteWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId.required(),
  })
  .required();
