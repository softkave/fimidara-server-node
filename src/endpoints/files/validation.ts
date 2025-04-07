import Joi from 'joi';
import {Readable} from 'stream';
import {kValidationSchemas} from '../../utils/validationUtils.js';
import {kFolderConstants} from '../folders/constants.js';
import folderValidationSchemas from '../folders/validation.js';
import {kFileConstants} from './constants.js';

const fileSizeInBytes = Joi.number()
  .min(0)
  .max(kFileConstants.maxFileSizeInBytes);

const mimetype = Joi.string().max(kFileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(kFileConstants.maxEncodingCharLength);
const ext = Joi.string().max(kFileConstants.maxExtCharLength);
const buffer = Joi.binary().max(kFileConstants.maxFileSizeInBytes);
const filepath = Joi.string()
  .regex(folderValidationSchemas.pathRegex)
  .min(kFolderConstants.minFolderNameLength)
  .max(
    kFolderConstants.maxFolderNameLength *
      (kFolderConstants.maxFolderDepth + 1) +
      kFileConstants.maxExtCharLength
  );

const clientMultipartId = Joi.string().max(
  kFileConstants.maxClientMultipartIdLength
);

const part = Joi.number()
  .integer()
  .min(kFileConstants.minPartNumber)
  .max(kFileConstants.maxPartNumber);

const readable = Joi.any().custom((value, helpers) => {
  if (value instanceof Readable) {
    return value;
  }
  throw new Error('Invalid data provided');
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
  ext,
  readable,
  fileMatcherParts,
  clientMultipartId,
  part,
};

export default fileValidationSchemas;
