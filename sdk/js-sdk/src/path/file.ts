import {compact, map} from 'lodash-es';
import {kDefaultServerURL} from '../constants.js';
import {fimidaraAddRootnameToPath} from './fimidaraAddRootnameToPath.js';

// export const kFimidaraImageResizeFitEnumMap = {
//   contain: 'contain',
//   cover: 'cover',
//   fill: 'fill',
//   inside: 'inside',
//   outside: 'outside',
// } as const;

// export const kFimidaraImageResizePositionEnumMap = {
//   top: 'top',
//   rightTop: 'right top',
//   right: 'right',
//   rightBottom: 'right bottom',
//   bottom: 'bottom',
//   leftBottom: 'left bottom',
//   left: 'left',
//   leftTop: 'left top',
//   north: 'north',
//   northeast: 'northeast',
//   east: 'east',
//   southeast: 'southeast',
//   south: 'south',
//   southwest: 'southwest',
//   west: 'west',
//   northwest: 'northwest',
//   centre: 'centre',

//   /** focus on the region with the highest Shannon entropy. */
//   entropy: 'entropy',

//   /** focus on the region with the highest luminance frequency, colour
//    * saturation and presence of skin tones. */
//   attention: 'attention',
// } as const;

// export type FimidaraImageResizeFitEnum = ValueOf<
//   typeof kFimidaraImageResizeFitEnumMap
// >;

// export type FimidaraImageResizePositionEnum = ValueOf<
//   typeof kFimidaraImageResizePositionEnumMap
// >;

// export type FimidaraImageResizeParams = {
//   width?: number;
//   height?: number;

//   /** How the image should be resized to fit both provided dimensions.
//    * (optional, default 'cover') */
//   fit?: keyof FimidaraImageResizeFitEnum;

//   /** Position, gravity or strategy to use when fit is cover or contain.
//    * (optional, default 'centre') */
//   position?: number | FimidaraImageResizePositionEnum;

//   /** Background colour when using a fit of contain, defaults to black without
//    * transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
//   background?: string;

//   /** Do not enlarge if the width or height are already less than the specified
//    * dimensions. (optional, default false) */
//   withoutEnlargement?: boolean;
// };

// export const kFimidaraImageFormatEnumMap = {
//   jpeg: 'jpeg',
//   png: 'png',
//   webp: 'webp',
//   tiff: 'tiff',
//   raw: 'raw',

//   // TODO: support gif
// } as const;

// export type FimidaraImageFormatEnum = ValueOf<
//   typeof kFimidaraImageFormatEnumMap
// >;

export type GetFimidaraReadFileURLProps = {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths.
   * You must also provide `workspaceRootname` */
  filepathWithoutRootname?: string;

  /** Workspace rootname, required if you're using `filepathWithoutRootname` */
  workspaceRootname?: string;

  /** Server URL, for if you're hosting you're own fimidara, or prefer a certain
   * host */
  serverURL?: string;

  /** Resize image to width */
  // width?: number;

  /** Resize image to height */
  // height?: number;

  /** How the image should be resized to fit both provided dimensions.
   * (optional, default 'cover') */
  // fit?: keyof FimidaraImageResizeFitEnum;

  /** Position, gravity or strategy to use when fit is cover or contain.
   * (optional, default 'centre') */
  // position?: number | FimidaraImageResizePositionEnum;

  /** Background colour when using a fit of contain, defaults to black without
   * transparency. (optional, default {r:0,g:0,b:0,alpha:1}) */
  // background?: string;

  /** Do not enlarge if the width or height are already less than the specified
   * dimensions. (optional, default false) */
  // withoutEnlargement?: boolean;

  /** Whether the server should add "Content-Disposition: attachment" header
   * which forces browsers to download files like HTML, JPEG, etc. which it'll
   * otherwise open in the browser */
  download?: boolean;
};

const kReadFileQueryMap: Partial<
  Record<keyof GetFimidaraReadFileURLProps, string>
> = {
  // width: 'w',
  // height: 'h',
  // fit: 'fit',
  // position: 'pos',
  // background: 'bg',
  // withoutEnlargement: 'withoutEnlargement',
  download: 'download',
};

function getFilepath(props: {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;
  workspaceRootname?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths. */
  filepathWithoutRootname?: string;
}) {
  const filepath = props.filepath
    ? props.filepath
    : props.filepathWithoutRootname && props.workspaceRootname
    ? fimidaraAddRootnameToPath(
        props.filepathWithoutRootname,
        props.workspaceRootname
      )
    : undefined;

  if (!filepath) throw new Error('Filepath not provided');
  return filepath;
}

export function getFimidaraReadFileURL(props: GetFimidaraReadFileURLProps) {
  let query = '';
  const filepath = getFilepath(props);
  const queryList = compact(
    map(props, (v, k) => {
      const qk = kReadFileQueryMap[k as keyof GetFimidaraReadFileURLProps];
      if (!qk) return undefined;
      return `${qk}=${String(v)}`;
    })
  );

  if (queryList.length) {
    query = `?${queryList.join('&')}`;
  }

  return (
    (props.serverURL || kDefaultServerURL) +
    '/v1/files/readFile/' +
    encodeURIComponent(
      filepath.startsWith('/') ? filepath.slice(1) : filepath
    ) +
    query
  );
}

export function getFimidaraUploadFileURL(props: {
  /** Filepath including workspace rootname OR file presigned path. */
  filepath?: string;

  /** Filepath without workspace rootname. Does not accept file presigned paths.
   * You must also provide `workspaceRootname` */
  filepathWithoutRootname?: string;

  /** Workspace rootname, required if you're using `filepathWithoutRootname` */
  workspaceRootname?: string;

  /** Server URL, for if you're hosting you're own fimidara, or prefer a certain
   * host */
  serverURL?: string;
}) {
  const filepath = getFilepath(props);
  return (
    (props.serverURL || kDefaultServerURL) +
    '/v1/files/uploadFile/' +
    encodeURIComponent(filepath.startsWith('/') ? filepath.slice(1) : filepath)
  );
}

export function stringifyFimidaraFilename(file: {name: string; ext?: string}) {
  const name = file.name + (file.ext ? `.${file.ext}` : '');
  return name;
}

export function stringifyFimidaraFilepath(
  file: {namepath: string[]; ext?: string},
  rootname?: string
) {
  const name = file.namepath.join('/') + (file.ext ? `.${file.ext}` : '');
  return rootname ? fimidaraAddRootnameToPath(name, rootname) : name;
}
