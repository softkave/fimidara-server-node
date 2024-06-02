import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import resourcesValidationSchemas from '../validation.js';
import {GetResourcesEndpointParams} from './types.js';

export const getResourcesJoiSchema = Joi.object<GetResourcesEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
