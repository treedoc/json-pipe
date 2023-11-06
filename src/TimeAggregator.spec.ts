// import { describe, expect, test } from "vitest";
import { TimeAggregator } from "./TimeAggregator";

const data = [
  { time: 1000, value: {a: 0, b: 7, name: "n1"} },
  { time: 1001, value: {a: 1, b: 6, name: "n2"} },
  { time: 1010, value: {a: 2, b: 5, name: "n1"} },
  { time: 1015, value: {a: 3, b: 4, name: "n1"} },
  { time: 1021, value: {a: 4, b: 3, name: "n2"} },
  { time: 1025, value: {a: 5, b: 2, name: "n1"} },
  { time: 1033, value: {a: 6, b: 1, name: "n2"} },
  { time: 1034, value: {a: 7, b: 0, name: "n2"} },
  null,
]

const data2 = [
  { time: 1000, value: {a: 0, name: "n1"} },
  { time: 1001, value: {a: 1, name: "n1"} },
  { time: 1010, value: {a: 2, name: "n1"} },
  { time: 1015, value: {a: 3, name: "n1"} },
  { time: 1021, value: {a: 4, name: "n1"} },
  { time: 1025, value: {a: 5, name: "n1"} },
  { time: 1033, value: {a: 6, name: "n1"} },
  { time: 1034, value: {a: 7, name: "n1"} },
  null,
]


describe('TimeAggregator', () => {
  const aggregator = new TimeAggregator("time", 10, 1, "value.name", {a: "value.a"});
  test('Simple', () => {
    const result: any[] = [];
    data.forEach(d => result.push(...aggregator.onData(d)));
    expect(result).toMatchSnapshot();
  });
});