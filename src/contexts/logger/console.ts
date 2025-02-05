import {Logger} from './types.js';

export class ConsoleLogger implements Logger {
  log: (...args: unknown[]) => void = (...args) => {
    console.log(new Date().toISOString(), ...args);
  };
  error: (...args: unknown[]) => void = (...args) => {
    console.error(new Date().toISOString(), ...args);
  };
}
