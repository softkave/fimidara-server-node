import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getRequestWorkspaceJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId.required(),
  })
  .required();
