# homebridge-gpio-services

Use config.json for examples.

## GPIO-Valve-Service

Use this accessory for Valve outlets. For example sprinklers.

| Attribute    | Type   | Default        | Description 
|--------------|--------|----------------|-------------
|name          | string | -              | Name of Accessory
|pin           | int    | -              | GPIO pin number. 
|invertHighLow | bool   | false          | Set to true if outlet has to be inverted.
|valveType     | string | "GenericValve" | Sets type of Accessory. <br>("Faucet"\|"ShowerHead"\|"Sprinkler"\|"GenericValve")
|manualDuration| int    | 300            | Time in Seconds. Default: 300 => 5min <br> (300\|600\|900\|1200\|1500\|1800\|2100\|2400\|2700\|3000\|3300\|3600)

## GPIO-Switch-Service

Use this accessory for wall switch.

| Attribute    | Type   | Default | Description 
|--------------|--------|---------|-------------
|name          | string | -       | Name of Accessory
|pin           | int    | -       | GPIO pin number.
|invertHighLow | bool   | false   | Set to true if outlet has to be inverted.

## GPIO-PushButton-Service

Use this accessory for push button. Switch will turn off after invokeTimeout.

| Attribute    | Type   | Default | Description 
|--------------|--------|---------|-------------
|name          | string | -       | Name of Accessory
|pin           | int    | -       | GPIO pin number.
|invertHighLow | bool   | false   | Set to true if outlet has to be inverted.
|invokeTimeout | int    | 500     | Timeout for push event in ms.

## Next Features

* GPIO-Valve-Service: start at specific DateTime will be added
* GPIO-GarageDoorOpener-Service: new Service
* GPIO-Doorbell-Service: new Service
* GPIO-ContactSensor-Service: new Service
* GPIO-StatelessProgrammableSwith-Service: new Service
* GPIO-Window-Service: new Service
* GPIO-WindowCovering-Service: new Service