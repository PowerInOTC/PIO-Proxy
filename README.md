# Proxy for Asset Price Query

## Overview
This project serves as a proxy to query asset prices from Financial Modeling Prep (FMP) and Alpaca APIs. It not only fetches the prices of the specified assets but also calculates and returns the pair price with a confidence level.

## Supported Assets

### FMP (Financial Modeling Prep)

- Forex (forex)
- NASDAQ stocks (stock.nasdaq)
- NYSE stocks (stock.nyse)
- AMEX stocks (stock.amex)

### Alpaca

- NASDAQ stocks (stock.nasdaq)
- NYSE stocks (stock.nyse)
- AMEX stocks (stock.amex)

## Installation

### Dependencies

To install the project dependencies, run:

```bash
npm install
```

### Environment Variables (.env)

This project utilizes environment variables for configuration. Here's an explanation of each variable:

#### Logs

- `LOG_LEVEL`: Specifies the logging level (e.g., debug, info, warn, error).
- `LOG_DIRECTORY`: Specifies the directory where log files are stored.

#### Web Server

- `HTTPS`: Specifies whether the server runs over HTTPS (true/false).
- `SSL_CERT_PRIVATE_KEY_PATH`: Path to the SSL private key file.
- `SSL_CERT_CERTIFICATE_PATH`: Path to the SSL certificate file.
- `SERVER_ADDRESS`: IP address where the server listens.
- `SERVER_PORT`: Port number where the server listens.

#### Limiter

- `WINDOW_TIME`: Specifies the time window (in milliseconds) for rate limiting.
- `MAX_REQUESTS`: Specifies the maximum number of requests allowed within the defined time window.

#### Prices

- `DEFAULT_AB_PRECISION`: Default precision for asset price.
- `DEFAULT_CONF_PRECISION`: Default precision for confidence level.
- `DEFAULT_MAX_TIMESTAMP_DIFF`: Default maximum timestamp difference.
- `MAX_AB_PRECISION`: Maximum precision for asset price.
- `MAX_CONF_PRECISION`: Maximum precision for confidence level.
- `MAX_MAX_TIMESTAMP_DIFF`: Maximum value for maximum timestamp difference.

#### FMP (Financial Modeling Prep)

- `FMP_KEY`: API key for accessing Financial Modeling Prep.

#### ALPACA

- `ALPACA_KEY`: API key for accessing Alpaca.
- `ALPACA_SECRET`: API secret for accessing Alpaca.

Make sure to set these variables in a `.env` file before running the application.

### Setting API Keys

To set your API keys for accessing the proxy, you need to modify the `keys.json` file. Follow these steps:

1. Open the `keys.json` file located in the config directory.

2. Update the `apiKeys` array with your API keys. Each API key should be a string enclosed in double quotes and separated by commas.

Example `keys.json` content:

```json
{
    "apiKeys": [
        "your_api_key_here"
    ]
}
```

## Usage

To start the proxy server, run:

```bash
npm start
```

## Example Query

To call the proxy and get the pair price, use the following example:

### Request
```http
GET /api/v1/get_pair_price?a=stock.nasdaq.TSLA&b=forex.EURUSD&abprecision=10&confprecision=10&maxtimestampdiff=10000
```

- `key`: Your API key.
- `a`: Specifies the first asset (e.g., stock.nasdaq.TSLA).
- `b`: Specifies the second asset (e.g., forex.EURUSD).
- `abprecision`: Precision for the asset price (e.g., 10).
- `confprecision`: Precision for the confidence level (e.g., 10).
- `maxtimestampdiff`: Maximum timestamp difference (e.g., 10).

### Response

The response will contain the pair price along with the confidence level.

```json
{
	"assetA": "stock.nasdaq.TSLA",
	"assetB": "forex.EURUSD",
	"pairBid": "187.8349336359",
	"pairAsk": "187.8429853444",
	"confidence": "0.0003682517",
	"timestamp": 1709140679842
}
```

- `assetA`: The first asset queried.
- `assetB`: The second asset queried.
- `pairBid`: Bid price for the asset pair.
- `pairAsk`: Ask price for the asset pair.
- `confidence`: Confidence level associated with the pair price.
- `timestamp`: Timestamp indicating when the price was generated.
