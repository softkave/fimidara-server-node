export function factorial(num: number, start: {index?: number; computed?: number} = {}) {
  let {index = 1, computed = 1} = start;

  for (; index < num; index++) {
    computed *= index;
  }

  return computed;
}

export function combination(total: number, subset: number) {
  const diff = total - subset;
  let fDiff: number;
  let fSubset: number;
  let fTotal: number;

  if (diff < subset) {
    fDiff = factorial(diff);
    fSubset = factorial(subset, {index: diff, computed: fDiff});
    fTotal = factorial(total, {index: subset, computed: fSubset});
  } else {
    fSubset = factorial(subset);
    fDiff = factorial(subset, {index: subset, computed: fSubset});
    fTotal = factorial(total, {index: diff, computed: fDiff});
  }

  return fTotal / (fSubset * fDiff);
}
