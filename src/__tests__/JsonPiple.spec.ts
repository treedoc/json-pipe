import stream = require('stream');
import { CliArg, JsonPipe } from '../JsonPipe';
import path = require('path');

class StringWritableStream extends stream.Writable {
  public str = "";
  _write(chunk: any, encoding: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean {
    cb && cb(null);
    this.str += chunk;
    return true;
  }
}

async function runAndVerifyJsonPipe(arg: CliArg, inputFile = 'sample/sample.json') {
  arg.inputFile = inputFile;
  const writeable = new StringWritableStream();
  // console.error(`Parsed argument: ${JSON.stringify(arg)}`);
  await new JsonPipe(arg, writeable).start();
  expect(writeable.str).toMatchSnapshot();
}

describe('JsonPipe', () => {
  test('mapToString', async () => {    
    const arg = new CliArg();
    arg.map = "`id: ${_.id}`";
    await runAndVerifyJsonPipe(arg);
  });

  test('mapToJson', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setMap('{id: _.id+1, firstName: _.first_name.toUpperCase()}'));
  });

  test('mapToJson', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setMap('{id: _.id+1, firstName: _.first_name.toUpperCase()}'));
  });

  test('simpleFilter', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setFilter('_.gender===\"Male\"'));
  });

  test('withImports', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setImports("sample/test.js").setFilter('m.filter').setMap('m.map'));
  });
});
