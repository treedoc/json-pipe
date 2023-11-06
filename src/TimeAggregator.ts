import * as _ from 'lodash';

export class Statistic {
  total: number = 0;
  min: any;
  max: any;
  sum: number = 0;
  avg: number = 0;
  p50: number = 0;
  p90: number = 0;
  p99: number = 0;
  values: number[] = [];

  public addValue(val: number) {
    this.total++;
    this.values.push(val);
    if (this.min === undefined || val < this.min)
      this.min = val;   
    if (this.max === undefined || val > this.max)
      this.max = val;
    this.sum += val;
  }

  public calculate() {
    this.avg = this.sum / this.total;
    this.p50 = this.values[Math.floor(this.values.length * 0.5)];
    this.p90 = this.values[Math.floor(this.values.length * 0.9)];
    this.p99 = this.values[Math.floor(this.values.length * 0.99)];
    // this.values = [];
    return this;
  }
}

export class StatisticDataPoint  {
  readonly statistics: {[key: string]: Statistic} = {};
  constructor(public readonly time: number = 0) {
  }

  public calculate(): StatisticDataPoint {
    for (const key of Object.keys(this.statistics)) {
      this.statistics[key].calculate();
    }
    return this;
  }
}

export class TimeAggregator<T> {
  lastTime: number = 0;
  dataPoints: StatisticDataPoint[] = [];

  constructor(
    public timeField: string,
    public sampleInterval: number,
    // Number of sampler intervals, by default 1
    public timeWindow = 1,
    public classifier: string | ((data: T) => string),
    public dataExtractor: {[key: string]: string | ((data: T) => number)} = {},
    ) {
  }
  
  public onData(data: T): StatisticDataPoint[] {
    const result: StatisticDataPoint[] = [];
    if (!data) {  // End of stream
      this.dataPoints.forEach(d => d.calculate());
      return this.dataPoints;
    }
    
    const strTime = _.get(data, this.timeField);
    if (strTime === undefined || Number.isNaN(strTime)) {
      throw new Error(`Time field ${this.timeField} not found or not a number type in data ${JSON.stringify(data)}`);
    }
    const time = Number(strTime);

    const windowStart = Math.floor(time / this.sampleInterval) * this.sampleInterval;
    if (this.lastTime < windowStart) {
      const timeWindowStart = windowStart - this.sampleInterval * this.timeWindow;
      while(this.dataPoints.length > 0 && this.dataPoints[0].time <= timeWindowStart)
        result.push(this.dataPoints.shift()!.calculate());
      this.dataPoints.push(new StatisticDataPoint(windowStart));
    }

    const classifier = this.extractStringField(data, this.classifier);
    this.dataPoints.forEach(d => {
      const dataValues = this.extractNumberFields(data, this.dataExtractor);
      for (const key of Object.keys(dataValues)) {
        const dataKey = `${classifier}.${key}`;
        d.statistics[dataKey] = d.statistics[dataKey] || new Statistic();
        d.statistics[dataKey].addValue(dataValues[key]);
      }
    })
    
    this.lastTime = time;
    return result;
  }

  extractNumberField(data: T, field: string | ((data: T) => number)): number {
    if (typeof field === 'string') {
      return _.get(data, field);
    } else {
      return field(data);
    }
  }

  extractStringField(data: T, field: string | ((data: T) => string)): string {
    if (typeof field === 'string') {
      return _.get(data, field);
    } else {
      return field(data);
    }
  }

  extractNumberFields(data: T, field:{[key:string]: string | ((data: T) => number)}): {[key: string]: number} {
    const result: {[key: string]: number} = {};
    for (const key of Object.keys(field)) {
      result[key] = this.extractNumberField(data, field[key]);
    }
    return result;
  }
}
