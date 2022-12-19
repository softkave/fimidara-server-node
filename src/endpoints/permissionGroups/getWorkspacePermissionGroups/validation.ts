import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';

export const getWorkspacePermissionGroupsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
  })
  .required();
