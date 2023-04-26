import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import resourcesValidationSchemas from '../validation';
import {GetResourcesEndpointParams} from './types';

export const getResourcesJoiSchema = Joi.object<GetResourcesEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
