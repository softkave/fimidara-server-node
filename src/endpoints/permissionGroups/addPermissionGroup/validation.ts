import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import {AddPermissionGroupEndpointParams, NewPermissionGroupInput} from './types';

export const addPermissionGroupJoiSchema = Joi.object<AddPermissionGroupEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    permissionGroup: Joi.object<NewPermissionGroupInput>()
      .keys({
        name: kValidationSchemas.name.required(),
        description: kValidationSchemas.description.allow(null),
      })
      .required(),
  })
  .required();
