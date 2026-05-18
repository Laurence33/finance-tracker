export type ForecastHorizon = 30 | 60 | 90;

export type ForecastEvent = {
  date: string;
  type: 'recurring' | 'lending_repayment' | 'income';
  label: string;
  amount: number;
};

export type ForecastDataPoint = {
  weekDate: string;
  best: number;
  expected: number;
  worst: number;
  events: ForecastEvent[];
};
