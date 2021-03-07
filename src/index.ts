#!/usr/bin/env node
import { CliSpec } from 'cli-arg-deco'
import 'process';
import 'path';
import { CliArg, JsonPipe } from './JsonPipe';

(async function main() {
  const spec = new CliSpec<CliArg>(CliArg);
  const parser = spec.parse(process.argv, 2);
  const cliArg = parser.target;
  console.error(`Parsed argument: ${JSON.stringify(cliArg)}`);
  if (parser.hasError()) {
    console.error(`Error parsing CLI parameters: ${parser.getErrorsAsString()}`);
    console.error(spec.printUsage());
    return -1;
  }
  if (cliArg.help) {
    console.error(spec.printUsage());
    return 0;
  }

  await new JsonPipe(cliArg).start();
})();

