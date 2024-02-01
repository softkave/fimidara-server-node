import * as Joi from 'joi';
import {Readable} from 'stream';
import {kValidationSchemas} from '../../utils/validationUtils';
import {kFolderConstants} from '../folders/constants';
import folderValidationSchemas from '../folders/validation';
import {kFileConstants} from './constants';

const fileSizeInBytes = Joi.number().min(0).max(kFileConstants.maxFileSizeInBytes);
const mimetype = Joi.string().max(kFileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(kFileConstants.maxEncodingCharLength);
const extension = Joi.string().max(kFileConstants.maxExtensionCharLength);
const buffer = Joi.binary().max(kFileConstants.maxFileSizeInBytes);
const filepath = Joi.string()
  .regex(folderValidationSchemas.pathRegex)
  .min(kFolderConstants.minFolderNameLength)
  .max(
    kFolderConstants.maxFolderNameLength * (kFolderConstants.maxFolderDepth + 1) +
      kFileConstants.maxExtensionCharLength
  );
const readable = Joi.any().custom((value, helpers) => {
  if (value instanceof Readable) {
    return value;
  }
  throw new Error('Invalid data provided.');
});

const fileMatcherParts = {
  filepath,
  fileId: kValidationSchemas.resourceId,
};

const fileValidationSchemas = {
  fileSizeInBytes,
  mimetype,
  encoding,
  buffer,
  extension,
  readable,
  fileMatcherParts,
};

export default fileValidationSchemas;
