import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getWorkspaceTagJoiSchema = Joi.object()
  .keys({workspaceId: validationSchemas.resourceId})
  .required();
