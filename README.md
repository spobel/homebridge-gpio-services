# homebridge-gpio-services

Use config.json for examples.

## GPIO-ContactSensor-Service

Use this accessory for contact sensor.

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

## GPIO-Switch-Service

Use this accessory for wall switch.

| Attribute    | Type   | Default | Description 
|--------------|--------|---------|-------------
|name          | string | -       | Name of Accessory
|pin           | int    | -       | GPIO pin number.
|invertHighLow | bool   | false   | Set to true if outlet has to be inverted.

## GPIO-Valve-Service

Use this accessory for Valve outlets. For example sprinklers.

| Attribute        | Type   | Default        | Description 
|------------------|--------|----------------|-------------
|name              | string | -              | Name of Accessory
|pin               | int    | -              | GPIO pin number. 
|invertHighLow     | bool   | false          | Set to true if outlet has to be inverted.
|valveType         | string | "GenericValve" | Sets type of Accessory. <br>("Faucet"\|"ShowerHead"\|"Sprinkler"\|"GenericValve")
|manualDuration    | int    | 300            | Time in Seconds. Default: 300 => 5min <br>(300\|600\|900\|1200\|1500\|1800\|2100\|2400\|2700\|3000\|3300\|3600)
|automationDateTime| string | -              | DateTime for automated irrigation. <br> Format: "HH:MM" <br> Example: 0:00 -> "00:00" 
|automationDuration| int    | 300            | Time in Seconds for automated irrigation. <br>Default: 300 => 5min <br>(300\|600\|900\|1200\|1500\|1800\|2100\|2400\|2700\|3000\|3300\|3600)
|isAutomationActive| bool   | false          | Activates automatic irrigation.

## Next Features

* GPIO-GarageDoorOpener-Service: new Service
* GPIO-Doorbell-Service: new Service
* GPIO-StatelessProgrammableSwith-Service: new Service
* GPIO-Window-Service: new Service
* GPIO-WindowCovering-Service: new Service