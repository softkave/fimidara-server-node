import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {UpdateFileBackendConfigEndpointParams} from './types';

export const updateFileBackendConfigJoiSchema =
  Joi.object<UpdateFileBackendConfigEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      configId: validationSchemas.resourceId,
      onReferenced: Joi.boolean(),
      config: Joi.object<UpdateFileBackendConfigEndpointParams['config']>()
        .keys({
          expires: validationSchemas.time.allow(null),
          providedResourceId: validationSchemas.providedResourceId.allow(null),
          name: validationSchemas.name.allow(null),
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
