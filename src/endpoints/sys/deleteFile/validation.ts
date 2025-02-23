import Joi from 'joi';
import {kValidationSchemas} from '../../../utils/validationUtils.js';
import folderValidationSchemas from '../../folders/validation.js';
import {SysDeleteFileEndpointParams} from './types.js';
import fileValidationSchemas from '../../files/validation.js';

export const sysDeleteFileJoiSchema = Joi.object<SysDeleteFileEndpointParams>()
  .keys({
    workspaceId: kValidationSchemas.resourceId.required(),
    fileId: kValidationSchemas.resourceId.required(),
    mountId: kValidationSchemas.resourceId.required(),
    part: fileValidationSchemas.partWithoutLastPart,
    multipartId: fileValidationSchemas.multipartId,
    namepath: folderValidationSchemas.namepath.required(),
    ext: fileValidationSchemas.ext,
  })
  .required();
