import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {UpdateFileBackendMountEndpointParams} from './types.js';

export const updateFileBackendMountJoiSchema =
  Joi.object<UpdateFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.workspaceResourceParts,
      mountId: kValidationSchemas.resourceId.required(),
      mount: Joi.object<UpdateFileBackendMountEndpointParams['mount']>()
        .keys({
          folderpath: folderValidationSchemas.folderpath,
          configId: kValidationSchemas.resourceId.allow(null),
          index: Joi.number(),
          mountedFrom: folderValidationSchemas.folderpath,
          name: kValidationSchemas.name,
          description: kValidationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
