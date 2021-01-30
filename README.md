<a href="https://github.com/treedoc/json-pipe"><img alt="GitHub Actions status" src="https://github.com/treedoc/json-pipe/workflows/Node%20CI/badge.svg"></a> [![codecov](https://codecov.io/gh/treedoc/json-pipe/branch/master/graph/badge.svg)](https://codecov.io/gh/treedoc/json-pipe)

# JSON-PIPE-TS

A CLI tool to filter and transfer a stream of JSON or LOG event into another JSON files using Javascript language syntax

## Background

Dealing with tons of log and JSON data files daily, and sick of the limitation of `grep` command. it becomes very necessary for me to find an easy-to-use tool to transfer log files or a JSON stream into a user friendly JSON data so that we can view it with powerful JSON viewer such as (http://treedoc.org), which provides rich UI interactions such as table view with filtering, sorting functions etc. Tried few existing tools, but none of them satisfies me. The most powerful and comprehensive tools is `jq` cli tool. but when I look at the enormous documentation which forces me to learn a brand new and pretty complex language just for the purpose to transfer JSON data doesn't make any sense for me. We already have so many powerful generic languages to deal with JSON, so why we need another So I decided to develop this simple CLI tool which leverages Javascript language to describe filter and transformation logic. This tools supports filter and transform operations. The input/output can be `stdin`/`stdout` or files. The input format can be JSON stream or Log file. The just script can be provide on the CLI or from javascript modules files. 

Another project has similar idea is `jsonmap`, but it can only support newline-delimited JSON files which restricted JSON in a single line. This `json-pipe` tools supports of any json format.

## Usage

### Install & Setup
- npm install: `npm i --global json-pipe-ts`
- run it after installed: `json-pipe -h`
- npx json-pipe-ts -h 
- Please refer to the help page for the detailed command line options and samples

## License

Copyright 2021 TreeDoc.org <BR>
Author/Developer: Jianwu Chen

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at <https://opensource.org/licenses/MIT>.
