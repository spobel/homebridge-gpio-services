# homebridge-gpio-services

Use config.json for examples.

## Installation
```
sudo npm install homebridge-gpio-services -g --unsafe-perm
```

## GPIO-Door-Service

Use this accessory for motorized door.

| Attribute               | Type   | Default | Description 
|-------------------------|--------|---------|-------------
|name                     | string | -       | Name of Accessory
|pin                      | int    | -       | GPIO pin number for engine open.
|invertHighLow            | bool   | false   | Set to true if pin outlet has to be inverted.
|timeOpen                 | int    | -       | Time needed to open in ms.
|pinClose                 | int    | -       | GPIO pin number for engine close.
|invertHighLowClose       | bool   | false   | Set to true if pinClose outlet has to be inverted.
|timeClose                | int    | -       | Time needed to close in ms.
|pinContactOpen           | int    | -       | GPIO pin number for contact open.
|invertHighLowContactOpen | bool   | false   | Set to true if pinContactOpen outlet has to be inverted.
|pinContactClose          | int    | -       | GPIO pin number for contact close.
|invertHighLowContactClose| bool   | false   | Set to true if pinContactClose outlet has to be inverted.

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
|automationDuration| int    | 300            | Time in Seconds for automated irrigation. <br>Default: 300 => 5min
|isAutomationActive| bool   | false          | Activates automatic irrigation.

## GPIO-Window-Service

Use this accessory for motorized window.

| Attribute               | Type   | Default | Description 
|-------------------------|--------|---------|-------------
|name                     | string | -       | Name of Accessory
|pin                      | int    | -       | GPIO pin number for engine open.
|invertHighLow            | bool   | false   | Set to true if pin outlet has to be inverted.
|timeOpen                 | int    | -       | Time needed to open in ms.
|pinClose                 | int    | -       | GPIO pin number for engine close.
|invertHighLowClose       | bool   | false   | Set to true if pinClose outlet has to be inverted.
|timeClose                | int    | -       | Time needed to close in ms.
|pinContactOpen           | int    | -       | GPIO pin number for contact open.
|invertHighLowContactOpen | bool   | false   | Set to true if pinContactOpen outlet has to be inverted.
|pinContactClose          | int    | -       | GPIO pin number for contact close.
|invertHighLowContactClose| bool   | false   | Set to true if pinContactClose outlet has to be inverted.

## GPIO-WindowCovering-Service

Use this accessory for motorized window covering.

| Attribute               | Type   | Default | Description 
|-------------------------|--------|---------|-------------
|name                     | string | -       | Name of Accessory
|pin                      | int    | -       | GPIO pin number for engine open.
|invertHighLow            | bool   | false   | Set to true if pin outlet has to be inverted.
|timeOpen                 | int    | -       | Time needed to open in ms.
|pinClose                 | int    | -       | GPIO pin number for engine close.
|invertHighLowClose       | bool   | false   | Set to true if pinClose outlet has to be inverted.
|timeClose                | int    | -       | Time needed to close in ms.
|pinContactOpen           | int    | -       | GPIO pin number for contact open.
|invertHighLowContactOpen | bool   | false   | Set to true if pinContactOpen outlet has to be inverted.
|pinContactClose          | int    | -       | GPIO pin number for contact close.
|invertHighLowContactClose| bool   | false   | Set to true if pinContactClose outlet has to be inverted.

## Next Features

* GPIO-GarageDoorOpener-Service: new Service
* GPIO-Doorbell-Service: new Service
* GPIO-StatelessProgrammableSwith-Service: new Service
