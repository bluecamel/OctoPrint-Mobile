# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
import octoprint.printer
import logging
import logging.handlers
from octoprint.events import eventManager, Events

import ConfigParser, hashlib, os
import re
from flask import make_response, render_template, jsonify, url_for, request

from octoprint_nautilus import settings

from jinja2 import Template
from StringIO import StringIO
import collections

from struct import unpack
from socket import AF_INET

import sys
if sys.platform == "win32":
	import win_inet_pton

from socket import inet_pton

home_folder = os.path.expanduser("~")

def is_external(ip):
	f = unpack('!I',inet_pton(AF_INET,ip))[0]
	private = (
		[ 2130706432, 4278190080 ], # 127.0.0.0,   255.0.0.0   http://tools.ietf.org/html/rfc3330
		[ 3232235520, 4294901760 ], # 192.168.0.0, 255.255.0.0 http://tools.ietf.org/html/rfc1918
		[ 2886729728, 4293918720 ], # 172.16.0.0,  255.240.0.0 http://tools.ietf.org/html/rfc1918
		[ 167772160,  4278190080 ], # 10.0.0.0,	255.0.0.0   http://tools.ietf.org/html/rfc1918
	)
	for net in private:
		if (f & net[1]) == net[0]:
			return False
	return True

class NautilusPlugin(octoprint.plugin.UiPlugin,
			octoprint.plugin.TemplatePlugin,
			octoprint.plugin.BlueprintPlugin,
			octoprint.plugin.EventHandlerPlugin,
			octoprint.plugin.SettingsPlugin,
			octoprint.plugin.StartupPlugin):

  ##octoprint.plugin.core.Plugin
	def initialize(self):
		#remember this values to send it when we reconnect
		self._logger.setLevel(logging.INFO)
		self.zchange = ""
		self.tool = 0
		self.show_M117 = True
		self._logger.info("Nautilus - OctoPrint mobile shell, started.")

	def on_after_startup(self):	
		if self._settings.get_boolean(["debug"]):
			self._logger.setLevel(logging.DEBUG)
			self._logger.debug( "Logging level is DEBUG...")
		else:
			self._logger.setLevel(logging.INFO)
			self._logger.info( "Logging level is INFO.")
		
		#user specficaly asked for messages to be ignored
		if self._settings.get_boolean(["ignore_M117"]):
			self.show_M117 = False
			self._logger.info( "M117 message will be ignored (settings)...")
		
		#detailedprogress sends too many messages. ignore them
		if self._plugin_manager.get_plugin("detailedprogress"):
			self.show_M117 = False
			self._logger.info( "M117 message will be ignored (Detailed Progress plugin)...")
	
	def read_profile(self):
		#hotend info from profile
		self.extruders = self._printer_profile_manager.get_current_or_default().get('extruder').get('count')
		#nozzle not yet supported by octoprint profile so assume if offset is 0 there's only one nozzle
		offsets = self._printer_profile_manager.get_current_or_default().get('extruder').get('offsets')
		if offsets == [(0.0, 0.0)] or offsets == [(0.0, 0.0), (0.0, 0.0)]:
			self.nozzles = 1
		else:
			self.nozzles = self.extruders
		self.nozzle_size = self._printer_profile_manager.get_current_or_default().get('extruder').get('nozzleDiameter')
		if self.extruders == 2 and self.nozzles == 1:
			self.nozzle_name = "cyclops"
		elif self.extruders == 2 and self.nozzles == 2:
			self.nozzle_name = "dual extruder"
		else:
			self.nozzle_name = ""
		
		#get values from RID file if available
		self.read_rid()
		
		
	##RID from smart head
	def read_rid(self):
		#format: extruders|nozzles|nozzle_size|name (ex: 2|2|0.8|volcano)
		hotend_file_config = os.path.join(home_folder, ".hotend")
		first_line = None
		if os.path.isfile(hotend_file_config):
			with open(hotend_file_config, 'r') as f:
				first_line = f.readline()
		if first_line:
			try:
				self.extruders, self.nozzles, self.nozzle_size, self.nozzle_name = first_line.split("|")
				self._logger.info( "Hotend config: %s extruder(s), %s %smm (%s) nozzle(s)."%(self.extruders, self.nozzles, self.nozzle_size,  self.nozzle_name))
			except:
				self._logger.error( "Hotend config file contains invalid data [%s]. Should be 'extruders|nozzles|nozzle_size|name'."%first_line )
		else:
			self._logger.debug( "Can't read the hotend config file. Default values used.")
		
	##octoprint.plugin.TemplatePlugin
	def get_template_configs(self):
		return [
			dict(type="settings", template="nautilus_settings.jinja2", custom_bindings=False)
		]
	
	##octoprint.plugin.SettingsPlugin
	def get_settings_defaults(self):
		return dict(
			movie_link = "http://octopi.local/downloads/timelapse/",
			_settings_version = None,
			external_only_webcam = True,
			ignore_M117 = False,
			debug = False
		)

	def on_settings_load(self):
		_settings = octoprint.plugin.SettingsPlugin.on_settings_load(self)
		
		inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")

		gcodes = None
		with open(inifile,'r') as f:
			gcodes = f.read()
		
		_settings.update({"gcodes":gcodes})
		
		return _settings
		
	def on_settings_save(self, data):
		if 'gcodes' in data:
			gcodes = data.pop('gcodes')
			outfile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
			with open(outfile, 'w') as configfile:
				configfile.write(gcodes)

			self._plugin_manager.send_plugin_message(self._identifier, dict(action = "settings"))

		octoprint.plugin.SettingsPlugin.on_settings_save(self, data)

		#check settings again
		self.on_after_startup()
			
	def get_settings_version(self):
		return 5

	def on_settings_migrate(self, target, current):
		#settings.ini version
		current = self._settings.get(["_settings_version"])
		if current is None or current < 5:
			self._logger.info( "Migrate settings from %s to %s."%(current, target))
			config = ConfigParser.ConfigParser(allow_no_value = True)
		
			settings.default(config)

			if os.path.isfile(os.path.join(self.get_plugin_data_folder(), "settings.ini")):
				inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
				settings.merge(config, inifile)

			outfile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
			with open(outfile, 'w') as configfile:
				config.write(configfile)
			
			self._settings.set(["_settings_version"], self.get_settings_version())

			
	##octoprint.plugin.UiPlugin
	def will_handle_ui(self, request):
		self._logger.debug( "will_handle_ui request headers:" )
		self._logger.debug( request.headers )
		return request.user_agent.string.startswith("Nautilus")
	
	def on_ui_render(self, now, request, render_kwargs):
		self._logger.debug( "on_ui_render request headers:" )
		self._logger.debug( request.headers )
		
		nautilus_url="plugin/%s"%self._identifier
		
		buttons = None
		custom_power, confirm = self.has_custom_power()
		if self._plugin_manager.get_plugin("switch", require_enabled=True):
			buttons = "switch_plugin"

		elif custom_power:
			buttons = "custom_power"
		
		axes = self._printer_profile_manager.get_current_or_default().get('axes')
		
		invert = [axes.get("x").get('inverted'), axes.get("y").get('inverted'), axes.get("z").get('inverted')]
		speed = [axes.get("x").get('speed'), axes.get("y").get('speed'), axes.get("z").get('speed')]
		home = self._printer_profile_manager.get_current_or_default().get('volume').get('origin')
		mark = ' style="color:#17b566"'
		if home == 'center':
			origin = ["", "", mark, "", ""]
		else:
			if invert[0] and invert[1]:
				origin = ["", "", "", mark, ""]
			elif invert[0]:
				origin = ["", "", "", "", mark]
			elif invert[1]:
				origin = [mark, "", "", "", ""]
			else:
				origin = ["", mark, "", "", ""]	

		return make_response(render_template("nautilus_index.jinja2", nautilus_url=nautilus_url, buttons=buttons, confirm=confirm, invert=invert, speed=speed, origin=origin) )

	
	def has_custom_power(self):
		on = False
		off = False
		confirm = ["",""]
		for action in self._settings.global_get(["system", "actions"]):
			if  action.get("action")  == "power_on_printer":
				self._logger.debug("power_on_printer '%s'"% action.get("command"))
				if action.get("confirm"):
					confirm[0] = action.get("confirm")
				on = True
			if  action.get("action")  == "shutdown_printer":
				self._logger.debug("shutdown_printer '%s'"% action.get("command"))
				if action.get("confirm"):
					confirm[1] = action.get("confirm")
				off = True
		self._logger.debug( "has_custom_power ? %s"%(on and off) )
		return (on and off), confirm
		
		
	##octoprint.plugin.BlueprintPlugin
	def is_blueprint_protected(self):
		return True
	
	@octoprint.plugin.BlueprintPlugin.route("/home", methods=["GET"])
	def check_home(self):
		self._logger.debug("X-Forwarded-For : [%s]"%request.headers.getlist("X-Forwarded-For")[0])
		if self._settings.get(["external_only_webcam"]):
			for remote in request.headers.getlist("X-Forwarded-For")[0].split(","): #always via haproxy ?
				if is_external(remote):
					return jsonify(home=False)
			return jsonify(home=True)
		else:			
			self._logger.debug("Forced 'home' access...")
			return jsonify(home=True)
	
	@octoprint.plugin.BlueprintPlugin.route("/unselect", methods=["GET"])
	def unselect_file(self):
		self._printer.unselect_file()
		return "OK"
	
	@octoprint.plugin.BlueprintPlugin.route("/settings/", methods=["GET"])
	@octoprint.plugin.BlueprintPlugin.route("/settings/<identifier>", methods=["GET"])
	def get_config(self, identifier = "preview"):
		
		inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
		with open(inifile) as foo:
			ini_as_text = foo.read()
		
		md5 = hashlib.md5(ini_as_text).hexdigest()
		
		#self._logger.debug("gcode version: remote ["  +identifier +"] vs local ["+md5+"] ...")
		if identifier == md5:
			return jsonify(update=False)

		else:
			has_errors = False
			retval = {}
			
			config = ConfigParser.ConfigParser()
			config.readfp(StringIO(ini_as_text))
		
			try:
				profile  = dict([a, int(x) if x.isdigit() else x] for a, x in config.items("profile"))
			except:
				self._logger.error("Unable to load [profile] section.")
				profile = dict()
		
			for section in config.sections():
				view = config.items(section)
				commands = {}
				for key,value in view:
					if section == "profile":
						commands.update({key: ",".join(map(str.strip, re.sub( '\s+', ' ', str(value)).split(',')) )})
					else:
						try:
							#replace all the variables in the ini file
							updated_value = Template(value).render(profile)
							#compact the gcode
							commands.update({key: ",".join(map(str.strip, re.sub( '\s+', ' ', str(updated_value)).split(',')) )})
							
						except Exception as e:
							self._logger.error("Syntax error %s.%s: [%s]", section, key, e)
							commands.update({key: "M117 Command configuration error."})
							has_errors = True
						
				retval.update({section: collections.OrderedDict(sorted(commands.items()))})

			if identifier == "preview":
				try:
					del retval["profile"]
				except:
					pass
			else:
				self._logger.debug("new settings version: remote ["+identifier +"] vs local [" + md5 + "] ...")
				retval.update({'update':True, 'id':md5})

			if has_errors and identifier != "preview":
				message = "The settings file has errors. Please verify and fix before doing anything else."
				self._printer.commands("M117 %s"%message)
				
				#important message. make sure it's delivered!
				if not self.show_M117:
					self._plugin_manager.send_plugin_message(self._identifier, dict(message=message))

			return jsonify(retval)
	
	##plugin hooks
	def custom_action_handler(self, comm, line, action, *args, **kwargs):
		if action[:7] == "zchange":
			self.zchange = action[8:]
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange))
		if action[:4] == "tool":
			self.tool = action[5]
			self._plugin_manager.send_plugin_message(self._identifier, dict(tool = self.tool))

	def M117Message(self, comm_instance, phase, cmd, cmd_type, gcode, *args, **kwargs):
		if gcode and cmd.startswith("M117") and self.show_M117:
				self._plugin_manager.send_plugin_message(self._identifier, dict(message=cmd[4:].strip()))
					
	##octoprint.plugin.EventHandlerPlugin
	def on_event(self, event, payload):
		if event == Events.CONNECTED:
			self.read_profile()
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange, port=self._printer.get_current_connection()[1], tool = self.tool, nozzles = self.nozzles, nozzle_size = self.nozzle_size, extruders = self.extruders, nozzle_name = self.nozzle_name))
		if event == Events.CLIENT_OPENED:
			self.read_profile()
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange, port=self._printer.get_current_connection()[1], tool = self.tool, nozzles = self.nozzles, nozzle_size = self.nozzle_size, extruders = self.extruders, nozzle_name = self.nozzle_name))
	
	##plugin auto update
	def get_version(self):
		return self._plugin_version
	
	def get_update_information(self):
		return dict(
			octoprint_nautilus=dict(
				displayName="Nautilus - OctoPrint mobile shell",
				displayVersion=self._plugin_version,
				
				# version check: github repository
				type="github_release",
				user="MoonshineSG",
				repo="OctoPrint-Mobile",
				current=self._plugin_version,
				
				# update method: pip
				pip="https://github.com/MoonshineSG/OctoPrint-Mobile/archive/{target_version}.zip"
			)
		)
		
def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = NautilusPlugin()
	
	global __plugin_hooks__
	__plugin_hooks__ = {"octoprint.comm.protocol.action": __plugin_implementation__.custom_action_handler,
		"octoprint.comm.protocol.gcode.queuing": __plugin_implementation__.M117Message,
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}






