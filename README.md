# async-samp-query

Simplified SAMP API client

## Installation
Using **npm**
```
npm i async-samp-query
```
or using **yarn**
```
yarn add async-samp-query
```

## Code example
```javascript
import query from "async-samp-query";

async function main() {
  const data = await query({
    host: "play.uifserver.net",
    port: 7776,
  });

  console.log(data);
}

main();

```

Options: 
- host - **required**
- port (**7777** by default) - **optional**
- timeout (**5000** by default) - **optional**

## Output sample
```json
{
  "online": 402,
  "address": "play.uifserver.net",
  "port": 7776,
  "hostname": "UIF - United Islands Freeroam",
  "gamemode": "UIF Freeroam",
  "mapname": "English",
  "passworded": false,
  "maxplayers": 500,
  "rules": {
    "lagcomp": true,
    "mapname": "UIF build 155",
    "version": "0.3.7-R3",
    "weather": 10,
    "weburl": "www.uifserver.net",
    "worldtime": "12:00"
  }
}
```

## Todo
- Optimize dependencies
