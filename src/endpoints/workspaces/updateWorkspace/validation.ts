import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {endpointValidationSchemas} from '../../validation.js';
import {UpdateWorkspaceEndpointParams, UpdateWorkspaceInput} from './types.js';

export const workspaceInputJoiSchema = startJoiObject<UpdateWorkspaceInput>({
  name: kValidationSchemas.name,
  description: kValidationSchemas.description.allow(null),
}).required();

export const updateWorkspaceJoiSchema =
  startJoiObject<UpdateWorkspaceEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    workspace: workspaceInputJoiSchema.required(),
  }).required();
