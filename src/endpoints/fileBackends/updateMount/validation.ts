import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import {UpdateFileBackendMountEndpointParams} from './types.js';

export const updateFileBackendMountJoiSchema =
  startJoiObject<UpdateFileBackendMountEndpointParams>({
    ...endpointValidationSchemas.workspaceResourceParts,
    mountId: kValidationSchemas.resourceId.required(),
    mount: startJoiObject<UpdateFileBackendMountEndpointParams['mount']>({
      folderpath: folderValidationSchemas.folderpath,
      configId: kValidationSchemas.resourceId.allow(null),
      index: Joi.number(),
      mountedFrom: folderValidationSchemas.folderpath,
      name: kValidationSchemas.name,
      description: kValidationSchemas.description.allow(null),
    }).required(),
  }).required();
