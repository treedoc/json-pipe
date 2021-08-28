#!/usr/bin/env node
import { CliSpec } from 'cli-arg-deco'
import 'process';
import { CliArg, JsonPipe } from './JsonPipe';
import RemoteImport from 'remote-import';
// import { Interactive } from './Interactive';

RemoteImport.get().init({refreshDuration: 20000});
// RemoteImport.get().init();

// @ts-ignore
// import _ from "https://jspm.dev/lodash";
// _.add(1,2);

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

  // if (cliArg.interactive)
  //   new Interactive(cliArg).start();

  await new JsonPipe(cliArg).start();
})();
