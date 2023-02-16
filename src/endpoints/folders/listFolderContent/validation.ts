import * as Joi from 'joi';
import {AppResourceType} from '../../../definitions/system';
import {JoiSchemaParts} from '../../../utils/types';
import {endpointValidationSchemas} from '../../validation';
import folderValidationSchemas from '../validation';
import {IListFolderContentEndpointParams, IListFolderContentEndpointParamsBase} from './types';

export const listFolderContentBaseJoiSchemaParts: JoiSchemaParts<IListFolderContentEndpointParamsBase> =
  {
    ...folderValidationSchemas.folderMatcherParts,
    contentType: Joi.array()
      .items(Joi.string().valid(AppResourceType.File, AppResourceType.Folder))
      .max(2),
  };

export const listFolderContentJoiSchema = Joi.object<IListFolderContentEndpointParams>()
  .keys({
    ...listFolderContentBaseJoiSchemaParts,
    ...endpointValidationSchemas.paginationParts,
  })
  .required();
