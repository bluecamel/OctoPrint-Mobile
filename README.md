#Nautilus - mobile shell for OctoPrint


A simplified UI replacement for OctoPrint that has been optimised for iOS devices. 

The plugin requires at least ver 1.3 of OctoPrint and the companion Nautilus iOS app. The iOS app will force landscape, maintain the security API key and handle the server connection. It is available on [Apple AppStore](https://itunes.apple.com/us/app/id1125992543). 

[Read more...](https://github.com/MoonshineSG/OctoPrint-Mobile/wiki)

##Setup

See the [installation guide](https://github.com/MoonshineSG/OctoPrint-Mobile/wiki/Install)

##Issues

If you have problems with the plugin, don't write it in the Apple Appstore as a review. That, is a one way communication, and since I don't know who you are, I can't contact you. Most often than not, more information is needed to solve a problem. 

So please, open a [Github issue](https://github.com/MoonshineSG/OctoPrint-Mobile/issues/new).

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
 - ver 1.4.3 (plugin & ios) : caching & timeouts in the ios app, added link to timelapse in prowl notification, fix camera height, and most importantly, changed the keyword syntax for "current z" from "{z}" to "%z" 
 - ver 1.5   (plugin) : configurable temperature sliders (nozzles and bed) and support for `settings.ini` migration
 - ver 1.5.1 (plugin) : minor bug fixes
 - ver 1.5.2 (plugin) : removed default setting.ini, more configurable buttons (nozzle and bed temperature, fan speed, )
 - ver 1.5.3 (deleted) (plugin) : hide switch buttons when plugin not present
 - ver 1.5.4 (plugin) : fix bed temperature 
 - ver 1.5.5 (plugin) : fix windows dependency, remove prowl
 - ver 1.6   (plugin) : fix auto-update
 - ver 1.6.1 (plugin) : regresive auto-patch settings.ini for update 1.4.3 (for auto-update)
 - ver 1.6.2 (plugin) : added support for M117 messages and settings to disable "webcam only" for external access
 - ver 1.6.3 (plugin) : fix nozzle & bed temperature settings
 - ver 1.6.4/1.6.5 (plugin) : quick fix for a error causing "Invalid Api Key" for some users  / fix version up 
 - ver 1.7 (plugin) / ver 1.4 (ios) : X-Api-Key issues fix and iOS plugin version check
 - ver 1.7.1 (plugin) : cleanup new API Key implementation, fix "Detailed Progress" plugin conflict, error message when camera not available, added optional debug logs
 - ver 1.8 (plugin) / ver 1.4.1 (ios): 
	- support for inverted axes (see https://github.com/MoonshineSG/OctoPrint-Mobile/issues/18#issuecomment-272616681 and https://github.com/MoonshineSG/OctoPrint-Mobile/issues/29)
	
		> no configuration needed. Nautilus follows the printer profile set in OctoPrint
	
	- support for custom power buttons (see https://github.com/MoonshineSG/OctoPrint-Mobile/issues/23#issuecomment-277459712)
	
		> no configuration needed. If `Switch` plugin is not installed and Nautilus finds `power_on_printer` `shutdown_printer` actions in the system menu, it will add 2 buttons on the Nautilus printer panel. 
	
	- application reload after a server reboot when config or plugins change
	- better handling reconnections
	- fix fan slider disable condition
	- fix reconnect when OctoPrint is not available
 - ver 1.9 (plugin) : added "home" marker on the navigation page, added optional quick peek terminal, added camera rotation (follows OctoPrint settings)
