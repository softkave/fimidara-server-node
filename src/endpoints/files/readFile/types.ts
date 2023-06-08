import {FileMatcher} from '../../../definitions/file';
import {ObjectValues} from '../../../utils/types';
import {BaseContextType} from '../../contexts/types';
import {Endpoint} from '../../types';

export const ImageResizeFitEnumMap = {
  contain: 'contain',
  cover: 'cover',
  fill: 'fill',
  inside: 'inside',
  outside: 'outside',
};
export const ImageResizePositionEnumMap = {
  top: 'top',
  rightTop: 'right top',
  right: 'right',
  rightBottom: 'right bottom',
  bottom: 'bottom',
  leftBottom: 'left bottom',
  left: 'left',
  leftTop: 'left top',
  north: 'north',
  northeast: 'northeast',
  east: 'east',
  southeast: 'southeast',
  south: 'south',
  southwest: 'southwest',
  west: 'west',
  northwest: 'northwest',
  centre: 'centre',

  /** focus on the region with the highest Shannon entropy. */
  entropy: 'entropy',

  /** focus on the region with the highest luminance frequency, colour
   * saturation and presence of skin tones. */
  attention: 'attention',
};
export type ImageResizeFitEnum = ObjectValues<typeof ImageResizeFitEnumMap>;
export type ImageResizePositionEnum = ObjectValues<typeof ImageResizePositionEnumMap>;

export type ImageResizeParams = {
  width?: number;
  height?: number;

  /** How the image should be resized to fit both provided dimensions.
   * (optional, default 'cover') */
  fit?: keyof ImageResizeFitEnum;

  /** Position, gravity or strategy to use when fit is cover or contain.
   * (optional, default 'centre') */
  position?: number | ImageResizePositionEnum;

  /** Background colour when using a fit of contain, defaults to black without
   * transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
  background?: string;

  /** Do not enlarge if the width or height are already less than the specified
   * dimensions. (optional, default false) */
  withoutEnlargement?: boolean;
};

export const ImageFormatEnumMap = {
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  tiff: 'tiff',
  raw: 'raw',

  // TODO: support gif
};
export type ImageFormatEnum = ObjectValues<typeof ImageFormatEnumMap>;

export type ReadFileEndpointParams = {
  imageResize?: ImageResizeParams;
  imageFormat?: ImageFormatEnum;
} & FileMatcher;

export interface ReadFileEndpointResult {
  stream: NodeJS.ReadableStream;
  mimetype?: string;
  contentLength?: number;
}

export type ReadFileEndpoint = Endpoint<
  BaseContextType,
  ReadFileEndpointParams,
  ReadFileEndpointResult
>;

export type ReadFileEndpointHttpQuery = {
  w?: number;
  h?: number;
  fit?: keyof ImageResizeFitEnum;
  pos?: number | ImageResizePositionEnum;
  bg?: string;
  wEnlargement?: boolean;
  format?: ImageFormatEnum;
};
