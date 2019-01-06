# homebridge-gpio-services

Use config.json for examples.
There are some Services in BETA status, they may have bugs. You should only use BETA services for testing! 
BETA services are not finished, API may change!
When you find a bug in a service or BETA-service, please let me know by creating github issues.

Thanks for using this plugin.

## Installation

You need to install gcc 4.9 and g++ 4.9 as your default gcc and g++:
```
sudo apt-get install gcc-4.9 g++-4.9
sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.9 60 --slave /usr/bin/g++ g++ /usr/bin/g++-4.9
```

Install nodejs and npm:
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Install Homebridge:
```
sudo npm install homebridge -g --unsafe-perm
```

Install this plugin:
```
sudo npm install homebridge-gpio-services -g --unsafe-perm
```

## GPIO-ContactSensor-Service

Use this accessory for contact sensor. You can change the type of contact sensor in iOS (Window\|ContactSensor\|Garagedoor\|Covering\|Door).

| Attribute    | Type   | Optional | Default | Description 
|--------------|--------|----------|---------|-------------
|name          | string | [ ]      | -       | Name of Accessory
|pin           | int    | [ ]      | -       | GPIO pin number.
|invertHighLow | bool   | [x]      | false   | Set to true if outlet has to be inverted.


## GPIO-PushButton-Service

Use this accessory for push button. Switch will turn off automatically after invokeTimeout.

| Attribute    | Type   | Optional | Default | Description 
|--------------|--------|----------|---------|-------------
|name          | string | [ ]      | -       | Name of Accessory
|pin           | int    | [ ]      | -       | GPIO pin number.
|invertHighLow | bool   | [x]      | false   | Set to true if outlet has to be inverted.
|invokeTimeout | int    | [x]      | 500     | Timeout for push event in ms.


## GPIO-Switch-Service

Use this accessory for wall switch.

| Attribute    | Optional | Type   | Default | Description 
|--------------|----------|--------|---------|-------------
|name          | [ ]      | string | -       | Name of Accessory
|pin           | [ ]      | int    | -       | GPIO pin number.
|invertHighLow | [x]      | bool   | false   | Set to true if outlet has to be inverted.


## GPIO-Valve-Service

Use this accessory for Valve outlets. For example sprinklers.

| Attribute        | Optional | Type   | Default        | Description 
|------------------|----------|--------|----------------|-------------
|name              | [ ]      | string | -              | Name of Accessory
|pin               | [ ]      | int    | -              | GPIO pin number. 
|invertHighLow     | [x]      | bool   | false          | Set to true if outlet has to be inverted.
|valveType         | [x]      | string | "GenericValve" | Sets type of Accessory. <br>("Faucet"\|"ShowerHead"\|"Sprinkler"\|"GenericValve")
|manualDuration    | [x]      | int    | 300            | Time in Seconds. Default: 300 => 5min <br>(300\|600\|900\|1200\|1500\|1800\|2100\|2400\|2700\|3000\|3300\|3600)
|automationDateTime| [x]      | string | -              | DateTime for automated irrigation. <br> Format: "HH:MM" <br> Example: 0:00 -> "00:00" <br> not specified -> no automation
|automationDuration| [x]      | int    | 300            | Time in Seconds for automated irrigation. <br>Default: 300 => 5min
|isAutomationActive| [x]      | bool   | false          | Activates automatic irrigation.

HomeKit shows different icons for faucet and sprinkler in iOS 11.4. Shower head and generic valve will be shown as faucet in home app. Perhaps there will be different icons in future.

## GPIO

To activate GPIO configuration at startup you have to add a script like the following:
(You will need this to avoid wrong default values at boot time.)
```
sudo nano /etc/init.d/gpio
```
Script content :
```
#!/bin/sh
### BEGIN INIT INFO
# Provides:          gpio
# Required-Start:    $remote_fs dbus
# Required-Stop:     $remote_fs dbus
# Should-Start:      $syslog
# Should-Stop:       $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Enable GPIO
# Description:       Enable GPIO
### END INIT INFO

PATH=/sbin:/bin:/usr/sbin:/usr/bin
DESC="Enable GPIO for the Module"
NAME="gpio"
SCRIPTNAME=/etc/init.d/$NAME

. /lib/lsb/init-functions

case "$1" in
    start)
        log_daemon_msg "Enabling GPIO"
        success=0

    #Relais 1 Switch example at GPIO26
    if [ ! -e /sys/class/gpio/gpio26 ] ; then
        echo 26 > /sys/class/gpio/export
        success=$?
        echo out > /sys/class/gpio/gpio26/direction
        echo 1 > /sys/class/gpio/gpio26/value
    fi
    
    #Relais 2 Switch example at GPIO19
    if [ ! -e /sys/class/gpio/gpio19 ] ; then
        echo 19 > /sys/class/gpio/export
        success=$?
        echo out > /sys/class/gpio/gpio19/direction
        echo 1 > /sys/class/gpio/gpio19/value
    fi
    
    #Sensor 1 GPIO17
    if [ ! -e /sys/class/gpio/gpio17 ] ; then
         echo 17 > /sys/class/gpio/export
         success=$?
         echo in > /sys/class/gpio/gpio17/direction
    fi
    
    #Sensor 2 GPIO27
    if [ ! -e /sys/class/gpio/gpio27 ] ; then
        echo 27 > /sys/class/gpio/export
        success=$?
        echo in > /sys/class/gpio/gpio27/direction
    fi
    
    log_end_msg $success
    ;;
    *)
    echo "Usage: $SCRIPTNAME {start}" >&2
    exit 1
    ;;
esac

exit 0
```

Add script to startup:

```
sudo chmod +x /etc/init.d/gpio
sudo chown root:root /etc/init.d/gpio

sudo update-rc.d gpio defaults
sudo update-rc.d gpio enable
```


## Changelog

### [1.0.6]
+ fixing dependencies

### [1.0.5]
+ Readme.md: added installation Guide
+ Readme.md: added GPIO startup Guide
+ fixing bugs in Valve
+ added GPIO Debugger for development
+ refactoring accessories and gpio actuators

## Next Features

- GPIO-GarageDoorOpener-Service: new Service
