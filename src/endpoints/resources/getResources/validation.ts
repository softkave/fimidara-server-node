import * as Joi from 'joi';
import {validationSchemas} from '../../../utilities/validationUtils';
import resourcesValidationSchemas from '../validation';

export const getResourcesJoiSchema = Joi.object()
  .keys({
    workspaceId: validationSchemas.nanoid,
    resources: resourcesValidationSchemas.fetchResourceItemList.required(),
  })
  .required();
