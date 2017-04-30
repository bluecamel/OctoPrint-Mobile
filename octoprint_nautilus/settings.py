import ConfigParser
import re

def default(config):
	config.add_section("profile")
	
	config.set("profile", "max_m851", -15)

	config.set("profile", "x_max", 200)
	config.set("profile", "y_max", 200)
	config.set("profile", "z_max", 200)

	config.set("profile", "extrude", 5)
	config.set("profile", "extrude_more", 10)

	config.set("profile", "fast", "F10000")
	config.set("profile", "medium", "F6000")
	config.set("profile", "slow", "F3000")
	
	config.set("profile", "beep", "M300 S800 P200")

	config.add_section("printer")
	config.set("printer", "; temperature sliders")
	config.set("printer", "temperature_scale", "C")
	config.set("printer", "nozzle_temperatures", "100, 160, 180, 200, 210, 230, 250")
	config.set("printer", "bed_temperatures", "60, 70, 80, 90, 100, 110, 120")

	config.set("printer", "; flow and feed sliders up and down adjustemnt limit %")
	config.set("printer", "flow_adjustment_percentage", "10")
	config.set("printer", "feed_adjustment_percentage", "25")

	config.set("printer", "; mirrored tool (yes/no): no = left T0, right T1")
	config.set("printer", "mirrored_tool", "no")
	
	config.set("printer", "; %tool will be replaced with the tool id (0 or 1) and %flow with the slider value")
	config.set("printer", "flow_adjustment", "M221 T%tool S%flow, {{beep}}")
	config.set("printer", "; %feed will be replaced with the slider value")
	config.set("printer", "feed_adjustment", "M220 S%feed, {{beep}}")
	
	config.set("printer", "; %tool will be replaced with the tool id (0 or 1) and %temp with the slider value")
	config.set("printer", "nozzle_heater_on", "M104 T%tool S%temp, {{beep}}")
	config.set("printer", "nozzle_heater_off", "M104 T%tool S0, {{beep}}")
	config.set("printer", "bed_heater_on", "M140 S%temp, {{beep}}")
	config.set("printer", "bed_heater_off", "M140 S0, {{beep}}")
	config.set("printer", "; %speed will be replaced with the slider value")
	config.set("printer", "fan_on", "M106 S%speed")
	config.set("printer", "fan_off", "M106 S0")

	
	config.add_section("offset")

	config.set("offset", "prepare_offset", "M851, M851 Z{{max_m851}}, G28, G1 X{{x_max / 2}} {{fast}}, M114, {{beep}}")
	
	config.set("offset", "; %z will be replaced with the Z value of button that calls the function")
	config.set("offset", "send_relative_z", "G91, G1 Z%z F500, G90, M114, {{beep}}")

	config.set("offset", "; %z will be replaced with value of Z axis at runtime")
	config.set("offset", "save_offset", "M851 Z%z, M500, M851, G28 Z, {{beep}}")

	config.set("offset", "offset_done", "G1 Z5 {{slow}}, G1 X0 Y0 {{fast}}, M114")
	
	config.set("offset", "; custom buttons leveling")
	config.set("offset", "macro_1", "M48 X100 Y100 V4; Z-Probe repeatability")
	config.set("offset", "macro_2", "")
	config.set("offset", "macro_3", "")
	config.set("offset", "macro_4", "")
	
	config.set("offset", "; manual leveling")
	config.set("offset", "find_reference", "G28, G1 X0 {{fast}} Y{{y_max - 10}}, G30, G1 Z0, M114")
	config.set("offset", "front_middle", "G1 Z5 {{slow}}, G1 X{{x_max / 2 }} Y10 {{slow}}, G1 Z0, M114")
	config.set("offset", "back_left", "G1 Z5 {{slow}}, G1 X0 Y{{y_max - 10 }} {{slow}}, G1 Z0, M114")
	config.set("offset", "back_right", "G1 Z5 {{slow}}, G1 X{{x_max}} Y{{y_max - 10 }} {{slow}}, G1 Z0, M114")



	
	config.add_section("action")

	config.set("action", "home_all", "G28")
	config.set("action", "home_x", "G28 X")
	config.set("action", "home_y", "G28 Y")
	config.set("action", "home_z", "G28 Z")

	config.set("action", "auto_level", "G29")

	config.set("action", "; filament")
	config.set("action", "load_filament", "M83, G92 E0, G1 E620 {{medium}}, G92 E0")
	config.set("action", "unload_filament", "M83, G1 E-700 {{medium}}, G92 E0")

	config.set("action", "extrude", "G91, G1 E{{extrude}} F600, G90")
	config.set("action", "extrude_more", "G91, G1 E{{extrude_more}} F600, G90")

	config.set("action", "retract", "G91, G1 E-{{extrude}} F600, G90")
	config.set("action", "retract_more", "G91, G1 E-{{extrude_more}} F600, G90")

	config.set("action", "; goto commands")
	config.set("action", "goto_center", "G1 X{{x_max / 2}} Y{{y_max / 2 }} {{fast}}")

	config.set("action", "goto_back_left", "G1 X0 Y{{y_max - 10}} {{fast}}")
	config.set("action", "goto_back_right", "G1 X{{x_max - 10}} Y{{y_max - 10}} {{fast}}")
	config.set("action", "goto_front_left", "G1 X0 Y0 {{fast}}")
	config.set("action", "goto_front_right", "G1 X{{x_max - 10}} Y0 {{fast}}")

	config.set("action", "; general xyz movement")
	config.set("action", "goto_x_max", "G1 X{{x_max}} {{fast}}")
	config.set("action", "goto_y_max", "G1 Y{{y_max}} {{fast}}")
	config.set("action", "goto_z_max", "G1 Z{{z_max}} {{medium}}")

	config.set("action", "goto_x_min", "G1 X0 {{fast}}")
	config.set("action", "goto_y_min", "G1 Y0 {{fast}}")
	config.set("action", "goto_z_min", "G1 Z0 {{medium}}")

	config.set("action", "; misc")
	config.set("action", "motors_off", "M18")

#move these to "printer" section
patch_1 = ["; temperature sliders", "temperature_scale", "nozzle_temperatures", "bed_temperatures"]
#remove these from "printer"
patch_2 = ["nozzle_temperature_on", "nozzle_temperature_off", "bed_temperature_on", "bed_temperature_off"]

r_1 = (r"((?<!{){z}(?!}))", "%z")

def merge(config, inifile):
	section = None
	with open(inifile) as foo:
		lines  = foo.readlines()
		for line in lines:
			line = line.strip()
			
			#patch {z} to %z
			result = re.sub(r_1[0], r_1[1], line)
			if result:
			    line = result
			
			if line.startswith("["):
				section = line.translate(None, "[]")
			elif ":" in line:
				k, v = line.split(":")
				k = k.strip()
				v = v.strip()
				if k in patch_1:					
					config.set("printer", k, v)
				else:
					if k not in patch_2:
						config.set(section, k, v)
					
			elif "=" in line:
				k, v = line.split("=")
				k = k.strip()
				v = v.strip()
				if k in patch_1:
					config.set("printer", k, v)
				else:
					if k not in patch_2:
						config.set(section, k, v)

