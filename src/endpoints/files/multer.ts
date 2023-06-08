import multer = require('multer');
import {fileConstants} from './constants';

// TODO: make sure these configs are efficient
export const multerUploadFileExpressMiddleware = multer({
  limits: {
    fieldNameSize: 100,
    fieldSize: 1 * 1024 * 1204,
    fields: 1024,
    fileSize: fileConstants.maxFileSizeInBytes,
    files: 1,
    parts: 10000,
    headerPairs: 2000,
  },
});
