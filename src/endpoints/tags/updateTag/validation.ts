import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import {UpdateTagEndpointParams, UpdateTagInput} from './types.js';

export const updateTagJoiSchema = startJoiObject<UpdateTagEndpointParams>({
  tagId: kValidationSchemas.resourceId.required(),
  tag: startJoiObject<UpdateTagInput>({
    name: kValidationSchemas.name.allow(null),
    description: kValidationSchemas.description.allow(null),
  }).required(),
}).required();
