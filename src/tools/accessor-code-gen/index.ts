import assert from 'assert';
import {upperFirst} from 'lodash';

const kStart = '/** acg-start */';
const kEnd = '/** acg-end */';
const kStartClass = '/** acg-start-class */';
const kEndClass = '/** acg-end-class */';
const kInsertCodeStart = '/** acg-insert-code-start */';
const kInsertCodeEnd = '/** acg-insert-code-end */';
const kPropertyKeyStart = '/** acg-prop-key-start */';
const kPropertyKeyEnd = '/** acg-prop-key-end */';
const kPropertyTypeStart = '/** acg-prop-type-start */';
const kPropertyTypeEnd = '/** acg-prop-type-end */';

function getWorkingText(text: string) {
  const startIndex = text.indexOf(kStart);
  const endIndex = text.indexOf(kEnd);

  if (startIndex !== -1 && endIndex !== -1) {
    const effectiveStartIndex = startIndex + kStart.length;
    const effectiveEndIndex = endIndex + kEnd.length;
    return {
      startIndex: effectiveStartIndex,
      endIndex: effectiveEndIndex,
      text: text.slice(effectiveStartIndex, effectiveEndIndex),
    };
  }

  return undefined;
}

function getWorkingClasses(text: string) {
  let remainingText = text;
  let startIndex = remainingText.indexOf(kStartClass);
  let endIndex = remainingText.indexOf(kEndClass);
  const classes: string[] = [];

  while (startIndex !== -1 && endIndex !== -1) {
    const effectiveStartIndex = startIndex + kStartClass.length;
    const effectiveEndIndex = endIndex + kEndClass.length;
    const classText = remainingText.slice(effectiveStartIndex, effectiveEndIndex);
    classes.push(classText);
    remainingText = remainingText.slice(effectiveEndIndex);

    startIndex = remainingText.indexOf(kStartClass);
    endIndex = remainingText.indexOf(kEndClass);
  }

  return {classes};
}

type Annotated = {
  outerStartIndex: number;
  innerStartIndex: number;
  outerEndIndex: number;
  innerEndIndex: number;
  text: string;
};

function getAnnotated(text: string, startTag: string, endTag: string) {
  let remainingText = text;
  let startIndex = remainingText.indexOf(startTag);
  let endIndex = remainingText.indexOf(endTag);
  const annotated: Annotated[] = [];

  while (startIndex !== -1 && endIndex !== -1) {
    const effectiveStartIndex = startIndex + startTag.length;
    const effectiveEndIndex = endIndex + endTag.length;
    const annotatedText = remainingText.slice(effectiveStartIndex, effectiveEndIndex);
    annotated.push({
      outerStartIndex: startIndex,
      innerStartIndex: effectiveStartIndex,
      outerEndIndex: endIndex,
      innerEndIndex: effectiveEndIndex,
      text: annotatedText,
    });

    remainingText = remainingText.slice(effectiveEndIndex);
    startIndex = remainingText.indexOf(startTag);
    endIndex = remainingText.indexOf(endTag);
  }

  return annotated;
}

function getWorkingClassProperties(text: string) {
  let nextIndex = text.indexOf(kProperty);

  // while (nextIndex !== -1) {
  //   const effectiveIndex = nextIndex + kProperty.length
  //   const endIndex =
  //   // const fullPropertyText = text.sl
  // }
}

function begin(text: string) {
  const classes = getAnnotated(text, kStartClass, kEndClass);
  const generatedCode: string[] = [];

  classes.forEach(nextClass => {
    const properties = getAnnotated(nextClass.text, kPropertyKeyStart, kPropertyKeyEnd);
    const propTypes = getAnnotated(nextClass.text, kPropertyTypeStart, kPropertyTypeEnd);
    assert(properties.length === propTypes.length);

    properties.forEach((nextProperty, index) => {
      const propType = propTypes[index];
      const setFnName = `set${upperFirst(nextProperty.text)}`;
      const getFnName = `get${upperFirst(nextProperty.text)}`;
      const assertGetFnName = `assertGet${upperFirst(nextProperty.text)}`;
      const hasSetFn = nextClass.text.includes(setFnName);
      const hasGetFn = nextClass.text.includes(getFnName);
      const hasAssertGetFn = nextClass.text.includes(assertGetFnName);
      let classGeneratedCode = '';

      if (!hasSetFn) {
        const fnText = `${setFnName} = (data: ${propType.text}) => {
          this[${nextProperty.text}] = data;
          return this;
        }`;
        classGeneratedCode += fnText;
      }
      if (!hasGetFn) {
        const fnText = `${getFnName} = () => {
          return this[${nextProperty.text}];
        }`;
        classGeneratedCode += fnText;
      }
      if (!hasAssertGetFn) {
        const fnText = `${assertGetFnName} = () => {
          const data = this[${nextProperty.text}];
          if (!data) throw new Error("${nextProperty.text} not set.")
          return data;
        }`;
        classGeneratedCode += fnText;
      }
    });
  });
}
