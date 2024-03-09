import * as Joi from 'joi';
import {kFimidaraResourceType} from '../../../definitions/system';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointParamsBase,
} from './types';

const contentType = Joi.string().valid(
  kFimidaraResourceType.File,
  kFimidaraResourceType.Folder
);
export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<ListFolderContentEndpointParamsBase> =
  {
    ...folderValidationSchemas.folderMatcherParts,
    contentType,
  };

export const listFolderContentJoiSchema = Joi.object<ListFolderContentEndpointParams>()
  .keys({
    ...listFolderContentBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
