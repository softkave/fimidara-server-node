import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import resourcesValidationSchemas from '../validation';
import {IGetResourcesEndpointParams} from './types';

export const getResourcesJoiSchema = Joi.object<IGetResourcesEndpointParams>()
  .keys({
    workspaceId: validationSchemas.resourceId,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
