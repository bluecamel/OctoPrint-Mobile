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
from . import pyrowl

from jinja2 import Template
from StringIO import StringIO
import collections

from struct import unpack
from socket import AF_INET, inet_pton

home_folder = os.path.expanduser("~")

intervals = (
	('weeks', 604800),  # 60 * 60 * 24 * 7
	('days', 86400),	# 60 * 60 * 24
	('hours', 3600),	# 60 * 60
	('minutes', 60),
	('seconds', 1),
	)

def display_time(seconds, granularity=2):
	result = []
	
	for name, count in intervals:
		value = seconds // count
		if value:
			seconds -= value * count
			if value == 1:
				name = name.rstrip('s')
			result.append("{} {}".format(int(value), name))
	return ' and '.join(result[:granularity])

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
			octoprint.plugin.SettingsPlugin):
  
  ##octoprint.plugin.core.Plugin
	def initialize(self):
		#self._logger.setLevel(logging.DEBUG)
		
		#remember this values to send it when we reconnect
		self.zchange = ""
		self.tool = 0
		self._logger.info("Nautilus - OctoPrint mobile shell, started.")

	
	def read_profile(self):
		#hotend info from profile
		self.extruders = self._printer_profile_manager.get_current_or_default().get('extruder').get('count')
		#nozzle not yet supported by octoprint profile so assume if offset is 0 there's only one nozzle
		offsets = self._printer_profile_manager.get_current_or_default().get('extruder').get('offsets')
		if offsets == [(0.0, 0.0)]:
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
			self._logger.info( "Can't read the hotend config file. Default values used.")
		
	##octoprint.plugin.TemplatePlugin
	def get_template_configs(self):
		return [
			dict(type="settings", template="nautilus_settings.jinja2", custom_bindings=False)
		]
	
	##octoprint.plugin.SettingsPlugin
	def get_settings_defaults(self):
		return dict(
			prowl_key = None,
			movie_link = "http://octopi.local/downloads/timelapse/"
		)

	def on_settings_load(self):
		octoprint.plugin.SettingsPlugin.on_settings_load(self)
		
		inifile = os.path.join(self._basefolder, "default", "settings.ini")
		if os.path.isfile(os.path.join(self.get_plugin_data_folder(), "settings.ini")):
			inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")

		with open(inifile) as f:
			gcodes = f.read()
		
		return dict(
			prowl_key = self._settings.get(["prowl_key"]),
			movie_link = self._settings.get(["movie_link"]),
			gcodes = gcodes
		)
		
		
	def on_settings_save(self, data):
		if 'gcodes' in data:
			gcodes = data.pop('gcodes')
			inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
			f = open(inifile, 'w')
			f.write(gcodes)
			f.close()
			self._plugin_manager.send_plugin_message(self._identifier, dict(action = "settings"))

		octoprint.plugin.SettingsPlugin.on_settings_save(self, data)


	##octoprint.plugin.UiPlugin
	def will_handle_ui(self, request):
		return request.user_agent.string.startswith("Nautilus")
	
	def on_ui_render(self, now, request, render_kwargs):
		nautilus_url="plugin/%s"%self._identifier
		
		if self._plugin_manager.get_plugin("switch"):
			has_switch="true"
		else:
			has_switch="false"
		
		return make_response(render_template("nautilus_index.jinja2", nautilus_url=nautilus_url, has_switch=has_switch) )
	
	##octoprint.plugin.BlueprintPlugin
	def is_blueprint_protected(self):
		return True
	
	@octoprint.plugin.BlueprintPlugin.route("/home", methods=["GET"])
	def check_home(self):
		self._logger.info("X-Forwarded-For : [%s]"%request.headers.getlist("X-Forwarded-For")[0])
		for remote in request.headers.getlist("X-Forwarded-For")[0].split(","): #always via haproxy ?
			if is_external(remote):
				return jsonify(home=False)
		return jsonify(home=True)
	
	@octoprint.plugin.BlueprintPlugin.route("/unselect", methods=["GET"])
	def unselect_file(self):
		self._printer.unselect_file()
		return "OK"
	
	@octoprint.plugin.BlueprintPlugin.route("/settings/", methods=["GET"])
	@octoprint.plugin.BlueprintPlugin.route("/settings/<identifier>", methods=["GET"])
	def get_ini_settings(self, identifier = "preview"):
		
		inifile = os.path.join(self._basefolder, "default", "settings.ini")
		if os.path.isfile(os.path.join(self.get_plugin_data_folder(), "settings.ini")):
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
			
			ini_settings = ConfigParser.ConfigParser()
			ini_settings.readfp(StringIO(ini_as_text))
		
			try:
				profile  = dict([a, int(x) if x.isdigit() else x] for a, x in ini_settings.items("profile"))
			except:
				self._logger.info("Unable to load [profile] section. Missing? Not needed?")
				profile = dict()
		
			for section in ini_settings.sections():
				view = ini_settings.items(section)
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
				self._logger.info("new settings version: remote ["+identifier +"] vs local [" + md5 + "] ...")
				retval.update({'update':True, 'id':md5})

			if has_errors and identifier != "preview":
				self._printer.commands("M117 The settings file has errors. Please verify and fix before doing anything else.")

			return jsonify(retval)
	
	##plugin hook
	def custom_action_handler(self, comm, line, action, *args, **kwargs):
		if action[:7] == "zchange":
			self.zchange = action[8:]
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange))
		if action[:4] == "tool":
			self.tool = action[5]
			self._plugin_manager.send_plugin_message(self._identifier, dict(tool = self.tool))

	
	##octoprint.plugin.EventHandlerPlugin
	def on_event(self, event, payload):
		if event == Events.CONNECTED:
			self.read_profile()
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange, port=self._printer.get_current_connection()[1], tool = self.tool, nozzles = self.nozzles, nozzle_size = self.nozzle_size, extruders = self.extruders, nozzle_name = self.nozzle_name))
		if event == Events.CLIENT_OPENED:
			self.read_profile()
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange, port=self._printer.get_current_connection()[1], tool = self.tool, nozzles = self.nozzles, nozzle_size = self.nozzle_size, extruders = self.extruders, nozzle_name = self.nozzle_name))
		elif event == Events.PRINT_DONE:
			title = "Print Done"
			message="'{0}' printed in {1}. Timelapse will be available shortly.".format( os.path.basename(payload.get("file")), display_time(payload.get("time")) )
			link =  "{0}/{1}.mpg".format(self._settings.get(["movie_link"]).strip("/"), os.path.splitext(os.path.basename(payload.get("file")))[0])
			self.send_prowl(title, message, link)
			
	## Prowl notification
	def send_prowl(self, title, message, link = None):
		prowl_key = self._settings.get(["prowl_key"])
		self._logger.info("Sending message '{0}':'{1}' [{2}]".format(title, message, link))
		if prowl_key:
			try:
				service = pyrowl.Pyrowl(prowl_key)
				res = service.push("Nautilus", title, message, link).get(prowl_key)
				if res.get('code') == '200':
					self._logger.info( "Notification sent. %s remaining."%res.get('remaining') )
				else:
					self._logger.error( res.get('message') )
			except Exception as e:
				self._logger.error("Prowl notification failed. [%s]"%e)
		else:
			self._logger.info("Prowl not yet setup. Add your prowl_key in the config file.")
	
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

__plugin_name__ = "Nautilus"
__plugin_description__ = "Nautilus - OctoPrint mobile shell (simplified interface optimised for mobile devices)"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = NautilusPlugin()
	
	global __plugin_hooks__
	__plugin_hooks__ = {"octoprint.comm.protocol.action": __plugin_implementation__.custom_action_handler}






