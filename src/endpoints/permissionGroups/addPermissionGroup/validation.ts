import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {AddPermissionGroupEndpointParams, NewPermissionGroupInput} from './types';

export const addPermissionGroupJoiSchema = Joi.object<AddPermissionGroupEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    permissionGroup: Joi.object<NewPermissionGroupInput>()
      .keys({
        name: validationSchemas.name.required(),
        description: validationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
