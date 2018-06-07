# homebridge-gpio-services

Use config.json for examples.

## GPIO-Valve-Service
| Attribute    | Type   | Default        | Description 
|--------------|--------|----------------|-------------
|name          | string | -              | Name of Accessory
|pin           | int    | -              | GPIO pin number. 
|invertHighLow | bool   | false          | Set to true if outlet has to be inverted.
|valveType     | string | "GenericValve" | Sets type of Accessory. <br>("Faucet"\|"ShowerHead"\|"Sprinkler"\|"GenericValve")
|manualDuration| int    | 300            | Time in Seconds. Default: 300 => 5min <br> (300\|600\|900\|1200\|1500\|1800\|2100\|2400\|2700\|3000\|3300\|3600)

## GPIO-Switch-Service

| Attribute    | Type   | Default | Description 
|--------------|--------|---------|-------------
|name          | string | -       | Name of Accessory
|pin           | int    | -       | GPIO pin number.
|invertHighLow | bool   | false   | Set to true if outlet has to be inverted.
