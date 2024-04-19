export type AlpacaPrice = {
  t: string;
  ax: string;
  ap: number;
  as: number;
  bx: string;
  bp: number;
  bs: number;
  c: string[];
  z: string;
};

export type AlpacaPrices = {
  [symbol: string]: AlpacaPrice;
};

export type AlpacaResponse = {
  quotes: AlpacaPrices;
};
