import {multilineTextToParagraph} from '../fns';

describe('fns', () => {
  test('multilineTextToParagraph', () => {
    const startText = `
      Resource type permission is effected on. 
      Target ID or other target identifiers like folderpath 
      should be provided when using target type to limit from 
    `;
    const expectedText =
      'Resource type permission is effected on. Target ID or other target identifiers like folderpath should be provided when using target type to limit from';
    const resultText = multilineTextToParagraph(startText);
    expect(resultText).toBe(expectedText);
  });
});
