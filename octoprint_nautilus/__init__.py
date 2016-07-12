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
	
class NautilusPlugin(octoprint.plugin.UiPlugin,
	 		octoprint.plugin.TemplatePlugin,
			octoprint.plugin.AssetPlugin,
			octoprint.plugin.BlueprintPlugin,
			octoprint.plugin.EventHandlerPlugin,
			octoprint.plugin.SettingsPlugin):
					
	def initialize(self):
		#remember this value to send it when we reconnect
		self.zchange = ""
		self.tool = 0
		self.hotend = "chimera"
		self.original_marlin_estimate = 0.0
		self.marlin_estimate = 0.0
		self.warmup = 0.0
		self.almost_alert = True
		
		#self._logger.setLevel(logging.DEBUG)
		self._logger.info("Nautilus - OctoPrint mobile shell, started.")

	def get_assets(self):
		return dict(
			js=[
				"js/nautilus.js"
			],
			less=[],
			css= []
		)

	def get_settings_defaults(self):
		return dict(
			prowl_key = None
		)

	def will_handle_ui(self, request):
		#can be forced to show mobile UI
		if request.args.get('nautilus') == "true" :
			return True
		
		return request.user_agent.string.startswith("Nautilus")
		
	def on_ui_render(self, now, request, render_kwargs):
		nautilus_url="plugin/%s"%self._identifier

		if self._plugin_manager.get_plugin("switch"):
			has_switch="true"
		else:
			has_switch="false"

		#identify browser vs mobile app to show/hide 'desktop' ui link 	
		if request.user_agent.string.startswith("Nautilus") :
			browser="false"
		else:
			browser="true"

		return make_response(render_template("nautilus_index.jinja2", nautilus_url=nautilus_url, has_switch=has_switch, browser=browser) )

	@octoprint.plugin.BlueprintPlugin.route("/home", methods=["GET"])
	def check_home(self):
		self._logger.info("X-Forwarded-For : [%s]"%request.headers.getlist("X-Forwarded-For"))
		for remote in request.headers.getlist("X-Forwarded-For"): #always via haproxy
			if remote.split('.')[0] != '192':
				return jsonify(home=False)
		return jsonify(home=True)
	
	@octoprint.plugin.BlueprintPlugin.route("/unselect", methods=["GET"])
	def unselect_file(self):
		self._printer.unselect_file()
		return "OK"
			
	@octoprint.plugin.BlueprintPlugin.route("/settings/<identifier>", methods=["GET"])
	def get_ini_settings(self, identifier):
		ini_settings = ConfigParser.ConfigParser()
		inifile = os.path.join(self._basefolder, "settings.ini")
		if os.path.isfile(os.path.join(self.get_plugin_data_folder(), "settings.ini")):
			inifile = os.path.join(self.get_plugin_data_folder(), "settings.ini")
			
		ini_settings.read(inifile)
		md5 = hashlib.md5(open(inifile, 'rb').read()).hexdigest()
		#self._logger.debug("gcode version: remote ["  +identifier +"] vs local ["+md5+"] ...")
		if identifier == md5:
			return jsonify(update=False)
		else:
			self._logger.info("new settings version: remote ["+identifier +"] vs local [" + md5 + "] ...")
			retval = {'update':True, 'id':md5}
			for section in ini_settings.sections():
				view = ini_settings.items(section)
				commands = {} 
				for key,value in view:
					#remove all extra spaces
					commands.update({key: ",".join(map(str.strip, re.sub( '\s+', ' ', value).split(',')) )})
				retval.update({section: commands})
			return jsonify(retval)

	def custom_action_handler(self, comm, line, action, *args, **kwargs):
		if action[:7] == "zchange":
			self.zchange = action[8:]
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange))
		if action[:4] == "tool":
			self.tool = action[5]
			self.hotend = action[7:]
			self._plugin_manager.send_plugin_message(self._identifier, dict(tool = self.tool, hotend = self.hotend))
		elif action == "start":
			if self._printer.is_printing():
				current = self._printer.get_current_data()
				printTime = current.get("progress").get("printTime")
				self._logger.info("Warmup done. Adding %ssec to the estimation."%current.get("progress").get("printTime"))
				self.warmup = float(printTime)
				self.marlin_estimate += self.warmup
				self._plugin_manager.send_plugin_message(self._identifier, dict(marlin_estimate = self.marlin_estimate))
		
	def on_event(self, event, payload):
		if event == Events.CLIENT_OPENED:
			self._plugin_manager.send_plugin_message(self._identifier, dict(zchange = self.zchange, marlin_estimate = self.marlin_estimate, port=self._printer.get_current_connection()[1], tool = self.tool, hotend = self.hotend))
			
		elif event == Events.PRINT_DONE:
			message="Printed '{0}' in {1}. Estimated {2} ({3} + {4}) ".format( os.path.basename(payload.get("file")), display_time(payload.get("time")), display_time(self.marlin_estimate), display_time(self.original_marlin_estimate), display_time(self.warmup) )
			title = "Print Done"
			self.send_prowl(title, message)
		elif event == Events.PRINT_STARTED:
			self.almost_alert = True
			
			meta = self._file_manager.get_metadata("local", payload.get("file"))
			self._logger.info(meta)
			try:
				self.marlin_estimate = meta.get("userdata").get("estimation").get("machine")
				self.original_marlin_estimate = self.marlin_estimate
			except Exception as e:
				self._logger.error(e)
				self._logger.info("marlin_estimate can't be found")
				
			try:
				hotend = meta.get("userdata").get("hotend")
				self._logger.info("hotend %s"%hotend)
				if hotend.startswith("cyclops"):
					self._printer.commands("M890 N1")
				elif hotend.startswith("chimera"):
					self._printer.commands("M890 N2")
			except Exception as e:
				self._logger.error(e)
				self._logger.info("hotend can't be found")
						
	def send_prowl(self, title, message):
		prowl_key = self._settings.get(["prowl_key"])
		self._logger.info("Sending message '{0}':'{1}'".format(title, message))
		if prowl_key:
			try:
				service = pyrowl.Pyrowl(prowl_key)
				res = service.push("Nautilus", title, message).get(prowl_key)
				if res.get('code') == '200':
					self._logger.info( "Notification sent. %s remaining."%res.get('remaining') )
				else:
					self._logger.error( res.get('message') )
			except Exception as e:
				self._logger.error("Prowl notification failed. [%s]"%e)
		else:
			self._logger.info("Prowl not yet setup. Add your prowl_key in the config file.")	

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
			





