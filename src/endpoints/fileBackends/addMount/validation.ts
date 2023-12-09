import * as Joi from 'joi';
import {validationSchemas} from '../../../utils/validationUtils';
import folderValidationSchemas from '../../folders/validation';
import {endpointValidationSchemas} from '../../validation';
import fileBackendValidationSchemas from '../validation';
import {AddFileBackendMountEndpointParams} from './types';

export const addFileBackendMountJoiSchema =
  Joi.object<AddFileBackendMountEndpointParams>()
    .keys({
      ...endpointValidationSchemas.optionalWorkspaceIdParts,
      mount: Joi.object<AddFileBackendMountEndpointParams['mount']>()
        .keys({
          folderpath: folderValidationSchemas.folderpath.required(),
          backend: fileBackendValidationSchemas.nonFimidaraBackend.required(),
          configId: validationSchemas.resourceId.allow(null),
          index: Joi.number().required(),
          mountedFrom: folderValidationSchemas.folderpath.required(),
          name: validationSchemas.name.required(),
          description: validationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
