#Nautilus - mobile shell for OctoPrint


Octoprint simplified interface optimized for ios devices (only works on dev branch of Octoprint)

The iOS app will force landscape, maintain the API key and handle the server connection.

Bonus feature: shake to refresh.

The iOS app is available on [Apple AppStore](https://itunes.apple.com/us/app/id1125992543) 

[more...](https://github.com/MoonshineSG/OctoPrint-Mobile/wiki)

##Setup


See the [installation guide](https://github.com/MoonshineSG/OctoPrint-Mobile/wiki/Install)

##Printing in progress

![screenshot](https://moonshinesg.github.io/images/nautilus/printing.gif)

##Updates
 
 - ver 1.2  (plugin & ios) : For security reasons (API_KEY sent in clear), access is only allowed via the iOS app
 - ver 1.2.1 (plugin) : OctoPrint improved estimations, so own estimations based on marlin firmware have been removed
 - ver 1.3 (plugin & ios) : fix fan slider on disconnect, minor change to improve load time, camera pinch-zoom bug fix
 - ver 1.3.1 (plugin) : added macro info button, change the  way error messages are displayed, replace bootstrap-notify with bootbox.alert
 - ver 1.3.2 (plugin) : added estimate explanation
 - ver 1.3.3 (plugin) : fix info screen, time estimation background colour changes, additional macro (why not?)
 - ver 1.3.4 (plugin) : fix internal address checking
 - ver 1.3.5 (plugin) : allow editing "settings.ini" via the OctoPrint UI (under settings)
 - ver 1.4   (plugin) : single/dual nozzle/extruder based on OctoPrint profile. Now available in the plugin repository.
 - ver 1.4.1 (plugin) : settings.ini now supports variables and math operations
 - ver 1.4.2 (plugin) : fix missing profile data
 - ver 1.4.3 (plugin & ios) : caching & timeouts in the ios app, added link to timelapse in prowl notification, fix camera height, and most importantly, changed the keyword syntax for "current z" from "{z}" to "%z" **User must manually change this!!!**
 - ver 1.5   (plugin) : configurable temperature sliders (nozzles and bed) and support for `settings.ini` migration
 - ver 1.5.1 (plugin) : minor bug fixes
 - ver 1.5.2 (plugin) : removed default setting.ini, more configurable buttons (nozzle and bed temperature, fan speed, )
 - ver 1.5.3 (deleted) (plugin) : hide switch buttons when plugin not present
 - ver 1.5.4 (plugin) : fix bed temperature 
 - ver 1.5.5 (plugin) : fix windows dependency, remove prowl
 - ver 1.6   (plugin) : fix auto-update