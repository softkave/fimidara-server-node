import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
import resourcesValidationSchemas from '../validation';
import {GetResourcesEndpointParams} from './types';

export const getResourcesJoiSchema = Joi.object<GetResourcesEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
