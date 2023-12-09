import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import {endpointValidationSchemas} from '../../validation';
import {UpdateFileBackendMountEndpointParams} from './types';

export const updateFileBackendMountJoiSchema =
  Joi.object<UpdateFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: validationSchemas.resourceId.required(),
      mount: Joi.object<UpdateFileBackendMountEndpointParams['mount']>()
        .keys({
          folderpath: folderValidationSchemas.folderpath,
          configId: validationSchemas.resourceId.allow(null),
          index: Joi.number(),
          mountedFrom: folderValidationSchemas.folderpath,
          name: validationSchemas.name,
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
