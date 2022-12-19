import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import resourcesValidationSchemas from '../validation';

export const getResourcesJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.resourceId,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
