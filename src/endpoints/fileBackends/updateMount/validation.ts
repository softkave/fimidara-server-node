import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {UpdateFileBackendMountEndpointParams} from './types';

export const updateFileBackendMountJoiSchema =
  Joi.object<UpdateFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: validationSchemas.resourceId,
      onReferenced: Joi.boolean(),
      mount: Joi.object<UpdateFileBackendMountEndpointParams['mount']>()
        .keys({
          expires: validationSchemas.time.allow(null),
          providedResourceId: validationSchemas.providedResourceId.allow(null),
          name: validationSchemas.name.allow(null),
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
