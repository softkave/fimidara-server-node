import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';

export const getWorkspacePermissionGroupsJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
  })
  .required();
