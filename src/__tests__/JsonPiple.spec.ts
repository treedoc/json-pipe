import stream = require('stream');
import { CliArg, FileType, JsonPipe } from '../JsonPipe';
import path = require('path');

class StringWritableStream extends stream.Writable {
  public str = "";
  _write(chunk: any, encoding: BufferEncoding, cb?: (error: Error | null | undefined) => void): boolean {
    cb && cb(null);
    this.str += chunk;
    return true;
  }
}

async function runAndVerifyJsonPipe(arg: CliArg) {
  if (!arg.inputFile)
    arg.inputFile = 'sample/sample.json';
  const writeable = new StringWritableStream();
  // console.error(`Parsed argument: ${JSON.stringify(arg)}`);
  await new JsonPipe(arg, writeable).start();
  expect(writeable.str).toMatchSnapshot();
}

describe('JsonPipe', () => {
  test('Map to string', async () => {    
    const arg = new CliArg();
    arg.map = "`id: ${_.id}`";
    await runAndVerifyJsonPipe(arg);
  });

  test('Map to JSON', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setMap('{id: _.id+1, firstName: _.first_name.toUpperCase()}'));
  });

  test('Simple Filter', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setFilter('_.gender===\"Male\"'));
  });

  test('With Imports', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setImports("sample/test.js").setFilter('m.filter').setMap('m.map'));
  });

  test('Mask Fields', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setMaskFields([".*email", ".*name"]));
  });

  test('Pretty print', async () => {
    await runAndVerifyJsonPipe(new CliArg().setIndentFactor(2));
  });

  test('Input Log type', async () => {    
    await runAndVerifyJsonPipe(new CliArg().setInputFile("sample/sample.log").setFileType(FileType.LOG).setFilter("_.guid==='guid1'"));
  });
});
