import * as fse from 'fs-extra';
import {HttpEndpointDefinition, docEndpoint} from './mddoc';
import path = require('path');

const dir = './mdoc';
const endpointsDir = './mdoc/fimidara-rest-api';

async function main() {
  await Promise.all([docEndpointListPaths(endpoints), ...endpoints.map(docEndpointFile)]);
}

function docEndpointFile(endpoint: InstanceType<typeof HttpEndpointDefinition>) {
  const filename = path.normalize(endpointsDir + '/' + endpoint.assertGetBasePathname() + '.md');
  const md = docEndpoint(endpoint);
  const doc = `---
title: ${endpoint.assertGetName()}
description: ${endpoint.assertGetDescription()}
---

# {% $markdoc.frontmatter.title %}
${md}
`;

  fse.ensureFileSync(filename);
  return fse.writeFile(filename, doc, {encoding: 'utf-8'});
}

interface IRawNavItem {
  key: string;
  label: string;
  withLink?: boolean;
  children?: IRawNavItem[];
}

function docEndpointListPaths(endpoints: Array<InstanceType<typeof HttpEndpointDefinition>>) {
  // const records: Array<IRawNavItem> = [];
  // const recordsMap: Record<string, Array<IRawNavItem>> = {};
  type PathRecord<T = any> = Record<string, T>;
  const records: PathRecord<PathRecord> = {};
  endpoints.forEach(endpoint => {
    const pathname = endpoint.assertGetBasePathname();
    const parts = pathname.split('/');
    // parts.forEach((part, i) => {
    //   if (!part) return;
    //   const parentPath = i > 0 ? parts.slice(0, i).join('/') : '';
    //   const parentChildren = parentPath ? recordsMap[parentPath] ?? [] : [];
    // });
    parts.reduce((map, part) => {
      if (!part) return map;
      map[part] = map[part] ?? {};
      return map[part];
    }, records);
  });

  const tocFilepath = dir + '/fimidara-rest-api-toc.json';
  return fse.writeFile(tocFilepath, JSON.stringify(records), {encoding: 'utf-8'});
}

main()
  .then(() => console.log('mddoc complete'))
  .catch(console.error.bind(console));
