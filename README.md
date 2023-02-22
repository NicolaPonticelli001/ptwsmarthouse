ATTENTION!!

This is an educational project! There are things that are not standard implemented and secure

ATTENTION!!

----------

What is SmartHouse
SmartHouse is the name of the solution that allows to control IoT devices using MQTT protocol (in this example is used HiveMQ public broker). The user will interact with the Raspberry PI. The website is accessible from internet using noip dns service. The webserver is implemented by Flask (Python framework).

----------

SmartHouse usage
A new user must to register to the website in order to use it.
A registrated user can access to his personal home page via insertion of his credentials previously choosen in the registration phase.
Once the user is logged, his home page will be displayed.
In this page you can control your devices based on the "type" of the device stored in the database. In fact the user can register:
- an house, with its information (address, location, etc) and a "friendly" name
- a room in an house with a "friendly" name
- a device in a room with a "friendly" name

The user can load his own code in an IoT device or simply connect the the IoT device to the network

Once the device is connected, it can be managed in the user home page
