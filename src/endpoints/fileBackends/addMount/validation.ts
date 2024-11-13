import Joi from 'joi';
import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {endpointValidationSchemas} from '../../validation.js';
import fileBackendValidationSchemas from '../validation.js';
import {AddFileBackendMountEndpointParams} from './types.js';

export const addFileBackendMountJoiSchema =
  startJoiObject<AddFileBackendMountEndpointParams>({
    ...endpointValidationSchemas.optionalWorkspaceIdParts,
    folderpath: folderValidationSchemas.folderpath.required(),
    backend: fileBackendValidationSchemas.nonFimidaraBackend.required(),
    configId: kValidationSchemas.resourceId.allow(null),
    weight: Joi.number().required(),
    mountedFrom: folderValidationSchemas.folderpath.required(),
    name: kValidationSchemas.name.required(),
    description: kValidationSchemas.description.allow(null),
  }).required();
