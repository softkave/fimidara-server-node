import * as Joi from 'joi';
import {kAppResourceType} from '../../../definitions/system';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {
  ListFolderContentEndpointParams,
  ListFolderContentEndpointParamsBase,
} from './types';

const contentType = Joi.string().valid(kAppResourceType.File, kAppResourceType.Folder);
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
