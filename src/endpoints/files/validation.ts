import * as Joi from 'joi';
import {validationSchemas} from '../../utilities/validationUtils';
import {fileConstants} from '../files/constants';
import {folderConstants} from '../folders/constants';
import {UploadFilePublicAccessActions} from './uploadFile/types';

const fileSizeInBytes = Joi.number()
  .integer()
  .max(fileConstants.maxFileSizeInBytes)
  .default(fileConstants.maxFileSizeInBytes);

const mimetype = Joi.string().max(fileConstants.maxMimeTypeCharLength);
const encoding = Joi.string().max(fileConstants.maxEncodingCharLength);
const extension = Joi.string().max(fileConstants.maxExtensionCharLength);
const buffer = Joi.binary().max(fileConstants.maxFileSizeInBytes);
const filepath = Joi.string()
  // eslint-disable-next-line no-useless-escape
  .regex(/[A-Za-z0-9\/._-]+/)
  .min(folderConstants.minFolderNameLength)
  .max(
    folderConstants.maxFolderNameLength * folderConstants.maxFolderDepth +
      fileConstants.maxExtensionCharLength
  );

const publicAccessAction = Joi.string().valid(
  ...Object.values(UploadFilePublicAccessActions)
);

const fileMatcherParts = {
  filepath,
  workspaceId: validationSchemas.nanoid,
  fileId: validationSchemas.nanoid,
};

const fileValidationSchemas = {
  fileSizeInBytes,
  mimetype,
  encoding,
  buffer,
  extension,
  fileMatcherParts,
  publicAccessAction,
};

export default fileValidationSchemas;
