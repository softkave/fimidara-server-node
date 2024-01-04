import * as Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils';
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
          configId: kValidationSchemas.resourceId.allow(null),
          index: Joi.number().required(),
          mountedFrom: folderValidationSchemas.folderpath.required(),
          name: kValidationSchemas.name.required(),
          description: kValidationSchemas.description.allow(null),
        })
        .required(),
    })
    .required();
