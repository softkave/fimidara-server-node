import {isBoolean, isNull} from 'lodash';
import {mergeData} from './fns';
import {AnyFn} from './types';

/** Return `-1` to move from node, `0` to enter node, `1` to select node, `2` to
 * add an entry to root when adding nodes. */
export type TreeFindFn<TNode> = (node: TNode) => number;

/** Return `index` to step into a node, return `true` to end and return current
 * node, and return `false` to end and return `undefined`. */
export type TreeIndexFindFn<TNode> = (
  node: TNode | undefined,
  row: number
) => string | boolean;

export type TreeNode<TNode> = [TNode, TreeNodes<TNode>];
export type TreeNodes<TNode> = Record<string, TreeNode<TNode>>;

export const kTreeFindFnSelectors = {
  next: -1,
  enter: 0,
  select: 1,
  /** for inserting nodes to the root. */
  root: 2,
};

export class Tree<TNode> {
  nodes: TreeNodes<TNode> = {};

  find(fn: TreeFindFn<TNode>): TNode | undefined {
    const result = this.__find(fn);
    return result ? result[0] : undefined;
  }

  findByIndex(fn: TreeIndexFindFn<TNode>): TNode | undefined {
    const result = this.__findByIndex(fn);
    return result ? result[0] : undefined;
  }

  findAndAdd(
    nodes: TreeNodes<TNode>,
    fn: TreeFindFn<TNode> = () => kTreeFindFnSelectors.root
  ) {
    const result = this.__find(fn);
    const place = isNull(result) ? this.nodes : result ? result[1] : undefined;

    if (place) {
      mergeData(place, nodes, {arrayUpdateStrategy: 'replace'});
    }
  }

  findByIndexAndAdd(nodes: TreeNodes<TNode>, fn: TreeIndexFindFn<TNode>) {
    const result = this.__findByIndex(fn);
    const place = isNull(result) ? this.nodes : result ? result[1] : undefined;

    if (place) {
      mergeData(place, nodes, {arrayUpdateStrategy: 'replace'});
    }
  }

  map<TResult>(fn: AnyFn<[TNode], TResult>): TResult[] {
    const result: TResult[] = [];
    const queue: TreeNodes<TNode>[] = [this.nodes];

    for (let head = queue.pop(); head; head = queue.pop()) {
      for (const key in head) {
        const [node, children] = head[key];
        result.push(fn(node));
        queue.push(children);
      }
    }

    return result;
  }

  protected __find(fn: TreeFindFn<TNode>) {
    let head: TreeNodes<TNode> | null = this.nodes;

    while (head) {
      const row: TreeNodes<TNode> = head;
      head = null;

      for (const key in row) {
        const node = row[key];
        const choice = fn(node[0]);

        if (choice === kTreeFindFnSelectors.next) {
          continue;
        } else if (choice === kTreeFindFnSelectors.enter) {
          head = node[1];
          break;
        } else if (choice === kTreeFindFnSelectors.select) {
          return node;
        } else if (choice === kTreeFindFnSelectors.root) {
          return null;
        }
      }
    }

    return undefined;
  }

  protected __findByIndex(
    fn: TreeIndexFindFn<TNode>
  ): [TNode | undefined, TreeNodes<TNode>] | undefined {
    let node: TNode | undefined = undefined;
    let head: TreeNodes<TNode> | undefined = this.nodes;
    let depth = 0;

    while (head) {
      const index = fn(node, depth);

      if (isBoolean(index)) {
        if (index === true) {
          return [node, head];
        } else {
          return undefined;
        }
      } else {
        [node, head] = head[index] || [];
        depth += 1;
      }
    }

    return undefined;
  }
}
