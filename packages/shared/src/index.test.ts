import { expect, test } from 'vitest';
import { greeting } from './index';

test('exports the hello-world greeting', () => {
  expect(greeting).toBe('Hello, Student House Game!');
});
