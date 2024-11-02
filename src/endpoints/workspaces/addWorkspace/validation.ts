import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import workspaceValidationSchemas from '../validation.js';
import {AddWorkspaceEndpointParams} from './types.js';

export const addWorkspaceJoiSchema = startJoiObject<AddWorkspaceEndpointParams>(
  {
    name: kValidationSchemas.name.required(),
    rootname: workspaceValidationSchemas.rootname.required(),
    description: kValidationSchemas.description.allow(null),
    workspaceId: kValidationSchemas.resourceId,
  }
).required();
