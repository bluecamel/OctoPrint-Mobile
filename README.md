#Nautilus - mobile shell for OctoPrint


Octoprint simplified interface optimized for ios devices (only works on dev branch of Octoprint)

The iOS app will force landscape, maintain the API key and handle the server connection.

Bonus feature: shake to refresh.

The iOS app is available on [Apple AppStore](https://itunes.apple.com/us/app/id1125992543) 

[more...](https://github.com/MoonshineSG/OctoPrint-Mobile/wiki)

##Setup

1. Install via Plugin Manager or manually using this URL: [https://github.com/MoonshineSG/Octoprint-Mobile/archive/master.zip](https://github.com/MoonshineSG/Octoprint-Mobile/archive/master.zip)

2. Get iOS application from [Apple AppStore](https://itunes.apple.com/us/app/id1125992543) (or compile, sign and install the ios app - developer license from Apple needed)

3. Edit the gcodes via OctoPrint settings. Optionally the prowl key.

4. Configure the URL and OctoPrint APP KEY in your iPhone/iPad settings.


##Printing in progress

![screenshot](screenshots/12.printing.gif)

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
 
