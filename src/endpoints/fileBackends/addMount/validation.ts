import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import {endpointValidationSchemas} from '../../validation';
import {AddFileBackendMountEndpointParams} from './types';

export const addFileBackendMountJoiSchema =
  Joi.object<AddFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      token: Joi.object<AddFileBackendMountEndpointParams['token']>()
        .keys({
          expires: validationSchemas.time.allow(null),
          providedResourceId: validationSchemas.providedResourceId.allow(null),
          name: validationSchemas.name.allow(null),
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
