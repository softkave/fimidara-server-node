import Joi from 'joi';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {JoiSchemaParts} from '../../../utils/types.js';
import {endpointValidationSchemas} from '../../validation.js';
import folderValidationSchemas from '../validation.js';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointParamsBase,
} from './types.js';

const contentType = Joi.string().valid(
  kFimidaraResourceType.File,
  kFimidaraResourceType.Folder
);
export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<ListFolderContentEndpointParamsBase> =
  {
    ...folderValidationSchemas.folderMatcherParts,
    contentType,
  };

export const listFolderContentJoiSchema =
  Joi.object<ListFolderContentEndpointParams>()
    .keys({
      ...listFolderContentBaseJoiSchemaParts,
      ...endpointValidationSchemas.paginationParts,
    })
    .required();
