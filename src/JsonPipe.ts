import { CliArgDeco, EnumValues, EnumsValueOf } from 'cli-arg-deco'
import { TD, TDJSONParser, TDJSONWriterOption, StringCharSource, TDEncodeOption, NodeFilter } from "treedoc"
import 'process';
import * as path from 'path';
import * as fs from 'fs';
// require = require("esm")(module/*, options*/)

// import { pipeline } from 'stream/promises'

// Following statement doesn't compile, not sure why
// import { pipeline } from 'stream/promises'
/* eslint-disable */
const { pipeline } = require('stream/promises');
import stream = require('stream');
const {Name, Description, Index, ShortName, Required, Examples, Decoder} = CliArgDeco;

export enum FileType { JSON, LOG }

@Name("json-pipe") 
@Description(
  `
  Transform an stream of JSON objects, or other input formats such as log file or CSV file, by applying a transform script. 

  Script can be performed in two levels: record level scripts and optional entire data set level.


  The transform script is written as Javascript expression, which the valuated value can be a simple type of a function as defined: 
    'null | boolean | object | string | (json: object, raw: string, ctx: object) => null | boolean | object | string'
  
  For expression of simple type, the expression will be evaluated for every json record, the json record will be passed as implicit variable of  "_".

  For expression of function type, the function will be called for every json record. The function will be provided with more arguments, including:
    json: current object (same as _ for expression of simple type)
    raw:  The raw string of the import
    ctx: The context stores any state across the script invocations. It can be used for aggregation function to store accumulated data.
  End of stream invocation
    If ctx is not any empty object, the function will be called at the end of stream with null json and raw to flush out the accumulated data.

  The return type of both the simple expression or the function will be of:
    null or false:  means no output for this input. (Aka: filter, negative)
    true: means output as the input (Aka: filter, positive)
    string: will output as is  (Aka: map as raw string)
    object: will be converted to JSON as output  (Aka: map)
    array: will be spread as multiple records. (Aka: flatMap). 

  The default record level script is: "_", 

  In addition to apply script for each records, it also support options (--dataSetScript -s) of script to apply on entire stream of data as an array of objects. 
  If this option is provided, all the transformed record will be accumulated into a single array add will be passed into the dataSetScript as the implement variable "_".
  The output of the datasetScript will be converted to a single JSON object. 

  Module import: 
  
  To reuse scripts either by yourself or third party, it's possible to import javascript using option (--imports, -m). The imported modules can be either
  local files or a remote URL. For local files, it's relative to current directly., The module fils can be either CommonJs Module or ES6 module. Multiple
  imports separated by ",", every import entry is in the format of [name]:[url], the name can be used in the script. 
   e.g.
  --imports m:test.js,loadash:https://jspm.dev/lodash


  
  Transform an stream of JSON objects or log entries by applying the stateful filter, map or aggregation expressions. 
  The expressions are written in Javascript. Expression could be either a simple expression or a function. If it's a function, the 
  function will be called with current json object for the evaluation. And function will be cached so that it's possible to keep 
  the evaluation state in its closure scope.
  
  For filter expression, it should return boolean, false means the records should be excluded.
  For map expression, the return type is: null | boolean | string | object
    null or false:  means no output for this input
    true: means output as the input
    string: will output as is
    object: will be converted to JSON as output
  For aggregator function, it's mostly the same as map function, except following
    If will take input as null which indicate that's a EOF call, so it will flush out all the remain aggregated data.

  The overall logic is as follow:
    for(const json in input) {
      if (!filter(json))
        continue;
      const mappedObj = map(json);
      if (!mappedObj)
        continue;
      const aggObj = aggregate(mappedObj);
      if (aggObj)
        output(aggObj);
    }
    const aggObj = aggregate(null);
    if (aggObj)
      output(aggObj);
  
  Current JSON object can be access as variable of '_'. If it's a function, the current JSON object will be passed as argument`)
@Examples([
  "For the sample data file used, please refer to https://github.com/treedoc/json-pipe/tree/master/sample\n",
  "Simple filter:    echo '{name: John, age: 10} {name: Alice, age: 30}' | json-pipe '{name: _.name.toUpperCase()}' -f '_.age<20' ",
  "Map to string:    cat sample/sample.json | json-pipe '`id: ${_.id}`'",
  "With input file:  json-pipe -i sample/sample.json '`id: ${_.id}`'",
  "Map to JSON:      cat sample/sample.json | json-pipe '{id: _.id+1, firstName: _.first_name.toUpperCase()}'",
  "Simple Filter:    cat sample/sample.json | json-pipe -f '_.gender===\"Male\"'",
  "With Imports:     cat sample/sample.json | json-pipe -m sample/test.js -f m.filter m.map",
  "With aggregator:  cat sample/sample.json | json-pipe -m sample/test.js -a m.aggregate",
  "Mask Fields:      cat sample/sample.json | json-pipe --maskFields .*email,.*name",
  "Pretty print:     cat sample/sample.json | json-pipe --indentFactor 2",
  "Input Log type:   cat sample/sample.log | json-pipe -t LOG -f \"_.guid==='guid1'\"",  
])
export class CliArg {
  @Index(0) @Description("Query expression") @Required(false)
  map = '_';

  @ShortName("f") @Description("Filter expression. if true, it will be included in the output")
  filter = 'true';

  @ShortName("a") @Description("Aggregator expression. if true, it will be included in the output")
  aggregator = 'true';

  @ShortName("i") @Description("Input file instead of stdin")
  inputFile?: string;

  @ShortName("o") @Description("Out file instead of stdout")
  outputFile?: string;
  
  @ShortName("m") @Description("Import external modules. Modules could be a local file or URL")
  imports?: string;

  @ShortName("t") @Description(`The file type, could be [${EnumValues(FileType)}], default is JSON`, ) @Decoder(_ => EnumsValueOf(FileType, _))
  fileType = FileType.JSON;

  @ShortName("p") @Description("For log fileType. The regex pattern to match the first line for the event and generate an array of that.")
  logPattern = "(?<time>\\d{4}\\/\\d{2}\\/\\d{2} \\d{2}:\\d{2}:\\d{2}.\\d{3}) *(?<level>[^ ]*) *\\[(?<name>.*?)\\] *\\[(?<thread>.*?)\\] *\\[(?<app>.*?)\\] *\\[(?<guid>.*?)\\] *(?<message>.*)";

  @Description("For log fileType. The max line of a single event if input is a log file")
  maxLine = 10000;

  @Description("Strip the file name section if the file is generated by grep of multiple files")
  stripFileName = false;

  @Description("List of mask out fields in regular expression to match the fields path, e.g.  '.*/firstName,.*/lastName'")
  maskFields: string[] = [];

  @Description("If indentFactor is not 0, the json out will be pretty formatted with the indentFactor")
  indentFactor = 0;

  @ShortName("h") @Description("Show usage")
  help = false;

  // For testing only
  setMap(map: string): CliArg { this.map = map; return this; }
  setFilter(filter: string): CliArg { this.filter = filter; return this; }
  setAggregator(aggregator: string): CliArg { this.aggregator = aggregator; return this; }
  setInputFile(inputFile: string): CliArg { this.inputFile = inputFile; return this; }
  setFileType(fileType: FileType): CliArg { this.fileType = fileType; return this; }
  setImports(imports: string): CliArg { this.imports = imports; return this; }
  setMaskFields(maskFields: string[]): CliArg { this.maskFields = maskFields; return this; }
  setIndentFactor(indentFactor: number): CliArg { this.indentFactor = indentFactor; return this; }
}

let m;

export class JsonPipe {
  readonly input: stream.Readable;
  readonly output: stream.Writable;
  funcCache: Map<string, (_: any) => any> = new Map();
  constructor(public readonly arg: CliArg, output?: stream.Writable) {
    this.input = this.arg.inputFile ? fs.createReadStream(this.arg.inputFile) : process.stdin;
    this.output = output ? output : this.arg.outputFile ? fs.createWriteStream(this.arg.outputFile) : process.stdout;
    if (arg.imports) {
      m = require(path.resolve(arg.imports));
      // console.log(m);
    }  
  }

  async start() {
    const THIS = this;
    if (this.arg.fileType === FileType.JSON)
      await pipeline(
        this.input,
        this.parseJson.bind(THIS),  // Not sure why this is not bound for generator function
        this.output,
        // this.handleError,
      )
    else if (this.arg.fileType === FileType.LOG) {
      await pipeline(
        this.input,
        this.parseLines.bind(THIS),  // Not sure why this is not bound for generator function
        this.parseLog.bind(THIS),
        this.output,
        // this.handleError,
      )
    }
  }

  handleError(err: any) {
    if (err) {
      console.error('Pipeline failed.', err);
    } else {
      console.error('Pipeline succeeded.');
    }
  }

  async *parseJson(source: any) {
    source.setEncoding('utf8');
    let remain = '';
    for await (const chunk of source) {
      const src = new StringCharSource((remain + chunk).trim());
      let bookmark = src.getBookmark();
      while(src.skipSpacesAndReturnsAndCommas()) {
        try {
          // TODO: implement resumable partial parsing (Non-blocking parsing)
          const node = TDJSONParser.get().parse(src);
          bookmark = src.getBookmark();
          // console.log("node=" + node.toString());
          // console.log(JSON.stringify(node.toObject(false)));
          const obj = this.transformAndToString(node.toObject(false));
          if (obj) 
            yield obj;
        } catch (e) {
          console.error(e.name);
          console.error(e);
          break;
        } finally {
          remain = src.str.substring(bookmark.pos);
        }
      }
    }
    const o = this.aggregateAndToString(null);
    if (o)
      yield o;
  }

  // transfer chunks to lines
  async * parseLines(source: any) {
    source.setEncoding('utf8');
    let remain = '';
    for await (const chunk of source) {
      const src = new StringCharSource((remain + chunk));
      while(true) {
        const line = src.readUntilTerminator('\n\r');
        if (src.isEof()) {
          remain = line; 
          break;
        }
        src.skipChars('\n\r');
        if (line)
          yield line + "\n";
      }
    }
  }

  async * parseLog(source: any) {
    const regex = new RegExp(this.arg.logPattern);
    let logEntry: any = {additionalMessage: ''};
    let lines = 0;
    for await (let line of source) {
      if (this.arg.stripFileName) {
        const p = (line as string).indexOf(':');
        if (p >= 0)
          line = line.substr(p+1); 
      }
        
      const groups = regex.exec(line);
      if (groups != null || lines >= this.arg.maxLine) {
        const obj = this.transformAndToString(logEntry);
        if (obj)
          yield obj;
        logEntry = groups != null ? groups.groups : {};
        logEntry.additionalMessage = '';
        lines = 0;
      } else {
        logEntry.additionalMessage += line;
        lines ++;
      }
    }
    const o = this.aggregateAndToString(null);
    if (o)
      yield o;
  }

  transformAndToString(_: any) {
    if (!this.evalScript(this.arg.filter, _))
      return undefined;

    const obj = this.evalScript(this.arg.map, _);
    return obj ? this.aggregateAndToString(obj) : undefined;
  }

  aggregateAndToString(obj: any) {
    obj = this.evalScript(this.arg.aggregator, obj);
    return obj ? this.toString(obj) : undefined;
  }

  private toString(obj: any): string {
    return typeof(obj) === 'string' ? obj + "\n" : this.toJson(obj) + "\n";
  }

  evalScript(script: string, _: any): any {
    const cachedFunc = this.funcCache.get(script);
    if (cachedFunc)
      return cachedFunc(_);

    // console.log(`script=${script}`);
    let result: any = {}
    try {
      /* tslint-disable */
      result = eval(script);
    } catch (e: any) {
      // console.error("Error eval: " + e);
      script = script.indexOf(" return ") > 0  // Wrapper with a function
          ? `(function(){${script}})()` : `(${script})`;
      /* tslint-disable */
      result = eval(script);
    }
    // console.log(`typeof result=${typeof result}`);
    if (typeof result === 'function') {  // Cache the function, so the function could keep state in it's closure
      this.funcCache.set(script, result);
      result = result(_);
    }
    return result === true ? _ : result;
  }

  toJson(obj: any) {
    const codeOpt = new TDEncodeOption().setJsonOption(
      new TDJSONWriterOption()
          .addNodeFilter(NodeFilter.mask(...this.arg.maskFields))
          .setIndentFactor(this.arg.indentFactor));
    return TD.stringify(obj, codeOpt)
  }
}
