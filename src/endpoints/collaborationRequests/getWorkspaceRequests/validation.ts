import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getWorkspaceRequestsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid.required(),
  })
  .required();
