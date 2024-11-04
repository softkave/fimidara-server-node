import {
  kValidationSchemas,
  startJoiObject,
} from '../../../utils/validationUtils.js';
import fileValidationSchemas from '../validation.js';
import {UploadFileEndpointParams} from './types.js';

export const uploadFileJoiSchema = startJoiObject<UploadFileEndpointParams>({
  ...fileValidationSchemas.fileMatcherParts,
  data: fileValidationSchemas.readable.required(),
  size: fileValidationSchemas.fileSizeInBytes.required(),
  description: kValidationSchemas.description.allow(null, ''),
  mimetype: fileValidationSchemas.mimetype.allow(null, ''),
  encoding: fileValidationSchemas.encoding.allow(null),
}).required();
