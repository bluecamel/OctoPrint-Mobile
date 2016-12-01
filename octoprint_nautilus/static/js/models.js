function ActionModel(){

	var self = this;
		
	self.extruder0_slider_value = ko.observable(0);
	self.extruder1_slider_value = ko.observable(0);
	self.bed_slider_value = ko.observable(0);

	self.config_extruder0_temp = ko.computed(function(){
		if (self.extruder0_slider_value() == 0) {
			$("#hotend0_slider").slider('setValue', 0);
		}
		return  settings.printer.nozzle_temperatures[self.extruder0_slider_value() - 1];
	});

	self.config_extruder1_temp = ko.computed(function(){
		if (self.extruder1_slider_value() == 0) {
			$("#hotend1_slider").slider('setValue', 0);
		}
		return  settings.printer.nozzle_temperatures[self.extruder1_slider_value() - 1];
	});

	self.config_bed_temp = ko.computed(function(){
		if (self.bed_slider_value() == 0) {
			$("#bed_slider").slider('setValue', 0);
		}
		return  settings.printer.bed_temperatures[self.bed_slider_value() - 1];
	});

	self.fan_slider_value = ko.observable(0);

	self.enable = ko.computed(function(){
		if (printer.acceptsCommands() && printer.power()){
			return true;
		} else {
			return false;
		}
	});
	
	self.canStartPrinting = ko.computed(function(){
		if (printer.operational() && printer.isFileLoaded() && ! (printer.printing() || printer.paused() )){
			return true;
		} else {
			return false;
		}
	});

	self.bed_temp = ko.computed(function(){
		if (printer.bed_target() == 0) {
			return sprintf(" %0.1f%s", printer.bed_actual(), settings.printer.temperature_scale);
		} else {
			if (printer.bed_actual() > printer.bed_target()) {
				return sprintf(" %0.1f%s &seArr; %s%s", printer.bed_actual(), settings.printer.temperature_scale, printer.bed_target(), settings.printer.temperature_scale);
			} else {
				return sprintf(" %0.1f%s &neArr; %s%s", printer.bed_actual(), settings.printer.temperature_scale,  printer.bed_target(), settings.printer.temperature_scale);
			}
		}		
	});
	
	self.extruder_temp = ko.computed(function(){
		var temp = " ";
		if (printer.inProgress()) {
				if (printer.extruder0_target() != 0) {
					if (printer.extruder0_actual() > printer.extruder0_target()) {
						temp += sprintf("%0.1f%s &seArr; %s%s", printer.extruder0_actual(), settings.printer.temperature_scale,  printer.extruder0_target(), settings.printer.temperature_scale);
					}	else {
						temp += sprintf("%0.1f%s &neArr; %s%s", printer.extruder0_actual(), settings.printer.temperature_scale,  printer.extruder0_target(), settings.printer.temperature_scale);
					}
				}
				if (printer.extruder1_target() != 0) {
					if (temp != " ") temp += " | ";
					if (printer.extruder1_actual() > printer.extruder1_target()) {
						temp += sprintf("%0.1f%s &seArr; %s%s", printer.extruder1_actual(), settings.printer.temperature_scale,  printer.extruder1_target(), settings.printer.temperature_scale);
					}	else {
						temp += sprintf("%0.1f%s &neArr; %s%s", printer.extruder1_actual(), settings.printer.temperature_scale,  printer.extruder1_target(), settings.printer.temperature_scale);
					}
				}
				if (temp == " ") {
					temp += sprintf("%0.1f%s", printer.extruder0_actual(), settings.printer.temperature_scale);
					if ( printer.dual_nozzle() ) {
						temp += sprintf(" | %0.1f%s", printer.extruder1_actual(), settings.printer.temperature_scale);	
					}
				}
		} else {
			if (printer.extruder0_target() == 0) {
				temp += sprintf("%0.1f%s", printer.extruder0_actual(), settings.printer.temperature_scale);
			} else {
				if (printer.extruder0_actual() > printer.extruder0_target()) {
					temp += sprintf("%0.1f%s &seArr; %s%s", printer.extruder0_actual(), settings.printer.temperature_scale,  printer.extruder0_target(), settings.printer.temperature_scale);
				}	else {
					temp += sprintf("%0.1f%s &neArr; %s%s", printer.extruder0_actual(), settings.printer.temperature_scale,  printer.extruder0_target(), settings.printer.temperature_scale);
				}
			}
			if ( printer.dual_nozzle() ) {
				temp += " | ";
				if (printer.extruder1_target() == 0) {
					temp += sprintf("%0.1f%s", printer.extruder1_actual(), settings.printer.temperature_scale);
				} else {
					if (printer.extruder1_actual() > printer.extruder1_target()) {
						temp += sprintf("%0.1f%s &seArr; %s%s", printer.extruder1_actual(), settings.printer.temperature_scale,  printer.extruder1_target(), settings.printer.temperature_scale);
					}	else {
						temp += sprintf("%0.1f%s &neArr; %s%s", printer.extruder1_actual(), settings.printer.temperature_scale,  printer.extruder1_target(), settings.printer.temperature_scale);
					}
				}
			}
		}
		return temp;
	});
	
	self.temp_visible = ko.computed(function() {
		return printer.extruder0_actual() > 0 || printer.extruder1_actual() > 0 ;
	});
	
	self.startPrint = function(){
		bootbox.confirm({ closeButton: false, message: "Start printing ?", callback: function(result) {
		  if (result) {
			sendJobCommand("start");
		  }
		}});
	}

	self.deselectFile = function(){
		unselect();
	}
	
	self.loadLatestFile = function(){
		getGcodeFiles(function(result){
			//console.log(_.last(_.sortBy(result.files, "date")).name);
			sendLoadFile(_.last(_.sortBy(result.files, "date")).name);
		});
	}

	self.showInfo = function(){
		var data = printer.fileInfo();
		var message = "Material : " + data.material +"<br/>Hotend : " + data.hotend +"<br/>Nozzle : " + data.nozzle +" mm<br/>Layer height : " +data.layer+" mm<br/>Extrusion width : " +data.width+" mm<br/>Speed : " + data.speed +" mm/min"
		info( message );
	}

	self.pausePrint = function(){
		sendJobCommand("pause");
	}

	self.cancelPrint = function(){
		bootbox.confirm({ closeButton: false, message: "Cancel printing ?", callback: function(result) {
		  if (result) {
			sendJobCommand("cancel");
		  }
		}});
	}
	
	self.sendRelativeG1 = function(data){
		sendCommand(["G91", "G1 "+data, "G90"]);
	}

	self.sendAbsoluteG1 = function(data){
		sendCommand("G1 "+data);
	}
	
	self.sendExtruder0Temperature = function(){
		if (self.extruder0_slider_value() == 0) {
			sendCommand( settings.printer.nozzle_heater_off.replace("%tool", 0).split(",") );
		} else {
			sendCommand( settings.printer.nozzle_heater_on.replace("%tool", 0).replace("%temp", self.config_extruder0_temp()).split(",") );
			self.extruder0_slider_value(0);
			switchPanel("status");
		}
	}

	self.sendExtruder1Temperature = function(){
		if (self.extruder1_slider_value() == 0) {
			sendCommand( settings.printer.nozzle_heater_off.replace("%tool", 1).split(",") );
		} else {
			sendCommand( settings.printer.nozzle_heater_on.replace("%tool", 1).replace("%temp", self.config_extruder1_temp()).split(",") );
			self.extruder1_slider_value(0);
			switchPanel("status");
		}
	}

	self.sendBedTemperature = function(){
		if (self.bed_slider_value() == 0) {
			sendCommand( settings.printer.bed_temperature_off.split(",") );
		} else {
			sendCommand( settings.printer.bed_temperature_off.replace("%temp", self.config_bed_temp()).split(",") );
			self.bed_slider_value(0);
			switchPanel("status");
		}
	}
	
	self.setFanSpeed = function(){
		if (self.fan_slider_value() == 0) {
			sendCommand( settings.printer.fan_off.split(",") );
		} else {
			sendCommand( settings.printer.fan_on.replace("%speed", Math.floor(255 * self.fan_slider_value()/100) ));
			self.fan_slider_value(0);
		}
	}
	
	self.load_filament = function(){
		 sendCommandByName('load_filament');
	}

	self.unload_filament = function(){
		sendCommandByName('unload_filament');
	}
}

function OffsetModel() {
	
	var self = this;

	self.current_z = ko.observable();	
	self.offset = ko.observable();
		
	self.prepared = ko.observable(false);
	
	self.m1 = ko.observable();
	self.m2 = ko.observable();
	self.m3 = ko.observable();
  self.m4 = ko.observable();
	
	self.update = function(){
		if (!self.prepared()) {
			self.current_z("reading...");	
			self.offset("reading...");
			sendCommand(["M114", "M851"]);
		}
	}

	self.prepareOffset = function(){
		sendCommand( settings.offset.prepare_offset.split(",") );
		self.prepared(true);
	}
	
	self.saveOffset = function(){
		sendCommand( settings.offset.save_offset.replace("%z", self.current_z()).split(","));
		self.prepared(false);
	}


	self.showMacro = function (){
		var message = "";
		if (settings.offset.macro_1 != "") {
			message += "M1 :<br/>&nbsp;&nbsp;&nbsp;" + settings.offset.macro_1.split(",").join("<br/>&nbsp;&nbsp;&nbsp;")+"<br/>";
		}
		if (settings.offset.macro_2 != "") {
			message += "M2 :<br/>&nbsp;&nbsp;&nbsp;" + settings.offset.macro_2.split(",").join("<br/>&nbsp;&nbsp;&nbsp;")+"<br/>";
		}
		if (settings.offset.macro_3 != "") {
			message += "M3 :<br/>&nbsp;&nbsp;&nbsp;" + settings.offset.macro_3.split(",").join("<br/>&nbsp;&nbsp;&nbsp;")+"<br/>";
		}
		if (settings.offset.macro_4 != "") {
			message += "M4 :<br/>&nbsp;&nbsp;&nbsp;" + settings.offset.macro_4.split(",").join("<br/>&nbsp;&nbsp;&nbsp;")+"<br/>";
		}
		
		info( message );
	}
	
	self.macro1 = function(){
		sendCommand( settings.offset.macro_1.split(","));
	}
	self.macro2 = function(){
		sendCommand( settings.offset.macro_2.split(","));
	}
	self.macro3 = function(){
		sendCommand( settings.offset.macro_3.split(","));
	}

	self.macro4 = function(){
		sendCommand( settings.offset.macro_4.split(","));
	}


	self.offsetDone = function(){
		sendCommand( settings.offset.offset_done.split(",") );
	}
	
	self.findZero = function(){
		sendCommand( settings.offset.find_reference.split(",") );
	}

	self.backLeft = function(){
		sendCommand( settings.offset.back_left.split(",") );
	}

	self.frontMiddle = function(){
		sendCommand( settings.offset.front_middle.split(",") );
	}

	self.backRight = function(){
		sendCommand( settings.offset.back_right.split(",") );
	}
	
	self.sendOffsetAdjustment = function(z){
		if (self.prepared()){
			sendCommand( settings.offset.send_relative_z.replace("%z", z).split(",") );
		} else {
			sendCommand( settings.offset.save_offset.replace( "%z", ( parseFloat(self.offset()) + parseFloat(z) ) ).split(",") 
			.concat(  settings.offset.send_relative_z.replace("%z", z).split(",")  )  );
		}
	}	
}


function PrinterModel(){
	var self = this;
	
	self.port = ko.observable("");
	self.version = ko.observable("");
	self.status =  ko.observable("Offline");
	
	self.status.subscribe(function(value) {
		if (self.error() || self.closedOrError() && value != "Offline"){
			$(".status_bar").css({"line-height": "20vh"});
			self.operational(false);
		} else {
			$(".status_bar").css({"line-height": $(".status_bar").css("height")});
		}
	});
	
	self.zoom =  ko.observable(false);
	
	self.zchange =  ko.observable("");
	
	self.progress = ko.observable(0);
	self.time_elapsed = ko.observable(0);
	self.time_left =  ko.observable(0);
	
	self.aprox_time_left =  ko.computed(function(){
		if (self.time_left() > 0) {
			return formatFuzzyPrintTime(self.time_left());
		} else {
			//aproximate based on percentage
			//return self.time_elapsed() * 100 / self.progress() - self.time_elapsed();
			return "Still stabilizing...";
		}
	});
  
	self.printTimeLeftOrigin = ko.observable(undefined);
   
	self.printTimeLeftOriginString = ko.pureComputed(function() {
      var value = self.printTimeLeftOrigin();
      switch (value) {
          case "linear": {
              return "Based on a linear approximation (very low accuracy, especially at the beginning of the print)";
          }
          case "analysis": {
              return "Based on the estimate from analysis of file (medium accuracy)";
          }
          case "mixed-analysis": {
              return "Based on a mix of estimate from analysis and calculation (medium accuracy)";
          }
          case "average": {
              return "Based on the average total of past prints of this model with the same printer profile (usually good accuracy)";
          }
          case "mixed-average": {
              return "Based on a mix of average total from past prints and calculation (usually good accuracy)";
          }
          case "estimate": {
              return "Based on the calculated estimate (best accuracy)";
          }
          default: {
              return "";
          }
      }
  });
  
  self.printTimeLeftOriginClass = ko.pureComputed(function() {
      var value = self.printTimeLeftOrigin();
      switch (value) {
          default:
          case "linear": {
              return "#f0555e";
          }
          case "analysis":
          case "mixed-analysis": {
              return "#ee404a";
          }
          case "average":
          case "mixed-average":
          case "estimate": {
              return "#ed2b36";
          }
      }
  });
	
	self.power = ko.observable(true);
	self.lights = ko.observable(false);
	self.mute = ko.observable(true);
	self.unload = ko.observable(false);
	self.poweroff = ko.observable(false);
	
	//whether the printer is currently connected and responding
	self.operational = ko.observable(null);
	//whether the printer is currently printing>
	self.printing = ko.observable(null);
	//whether the printer is currently disconnected and/or in an error state	
	self.closedOrError = ko.observable(null);
	//whether the printer is currently in an error state
	self.error = ko.observable(null);
	//whether the printer is currently paused
	self.paused = ko.observable(null);
	//whether the printer is operational and ready for jobs
	self.ready = ko.observable(null);


	self.bed_actual = ko.observable(0);
	self.bed_target = ko.observable(0);
	self.extruder0_actual = ko.observable(0);
	self.extruder0_target = ko.observable(0);
	self.extruder1_actual = ko.observable(0);
	self.extruder1_target = ko.observable(0);
	
	self.slicer_config = ko.observable(null);
	
	//hotend config
	self.dual_extruder =  ko.observable(false);
	self.dual_nozzle =  ko.observable(false);
	self.nozzle_size =  ko.observable(null);
	self.nozzle_name =  ko.observable(null);
		
	self.active_tool =  ko.observable(0);	
	
	self.fileToPrint = ko.observable(null);
	self.fileToPrint.subscribe(function(value) {
		if (value == null) {
			self.fileInfo(null);
			self.slicer_config(null)
		} else {
			getFileInfo(value);
		}
	});
	
	self.fileInfo = ko.observable(null);
	self.fileInfo.subscribe(function(value) {
		if (value != null) {
			//TODO: alert user if there is a mismatch between slicer profile and current hotend
			self.slicer_config(value.material +" on "+ value.nozzle + "mm "+ value.hotend);
		}
	});
	
	self.isFileLoaded = ko.computed(function(){
		if ( self.fileToPrint() == null){
			return false;
		} else {
			return true;
		}
	});
		
	self.acceptsCommands = ko.computed(function(){
		if (!self.power()) return false;
		if ( self.printing() ) {
			return false;
		} else {
			if (self.ready() ) {
				return true;
			} else {
				return false;
			}
		}
	});

	self.alwaysAcceptsCommands = ko.computed(function(){
		if ( self.power() && self.ready() ) {
			return true;
		} else {
			return false;
		}
	});
	
	//self.alwaysAcceptsCommands.extend({ notify: 'always' }); 
	
	
	self.operational.subscribe(function(value) {
		if (!value) {
			action.extruder0_slider_value(0);
			action.extruder1_slider_value(0);
			action.bed_slider_value(0);
			$("input.temp_slider").slider('disable');
			
			self.zchange("");
			$(".status_bar").css({"height": "100vh", "line-height": "100vh"});
		} else {
			$(".status_bar").css({"height": "33.34vh", "line-height": "33.34vh"});
		}
	});
	
	self.inProgress = ko.computed(function(){
		if ( self.printing() || self.paused() ){
			return true;
		} else {
			return false;
		}
	});

	self.inProgress.subscribe(function(value) {
		if (value) {
			$(".status_bar").css({"height": "20vh", "line-height": "20vh"});
			self.progress(0.1); //make sure the colors change
		} else {
			$(".status_bar").css({"height": "33.34vh", "line-height": "33.34vh"});
			printer.zoom(false);
			self.progress(0); 
		}
	});
	
	
	//self.acceptsCommands.extend({ notify: 'always' }); 
	
	self.acceptsCommands.subscribe(function(value) {
		if (value) {
			
			$("input.temp_slider").slider('enable');
			if (! self.dual_nozzle() ) {
				$("input.temp_slider_dual").slider('disable');
				$(".slider-row").css({"height": "20vh"});
			} else {
				if (self.dual_nozzle()){
					$("input.temp_slider_dual").slider('enable');
				} else  {
					$("input.temp_slider_dual").slider('disable');
				}
				$(".slider-row").css({"height": "15vh"});
			}
			$("#tool_select").bootstrapSwitch('disabled', false );

			$(".status_bar").css({"height": "33.34vh", "line-height": "33.34vh"});
			self.progress(0);
		} else {
			action.extruder0_slider_value(0);
			action.extruder1_slider_value(0);
			action.bed_slider_value(0);
			
			$("input.temp_slider").slider('disable');

			if (currentPanel == 'movement' || currentPanel == 'offset') switchPanel("status");
		}
	});

	self.dual_extruder.subscribe(function(value) {
		if (value) {
			if (self.acceptsCommands()) { 
				$("#tool_select").bootstrapSwitch('disabled', false);
			}
		} else {
			$("#tool_select").bootstrapSwitch('disabled', true);
		}
	});

	self.dual_nozzle.subscribe(function(value) {
		if (value) {
			if (self.acceptsCommands()) {
				$("input.temp_slider_dual").slider('enable');
			} else {
				$("input.temp_slider_dual").slider('disable');
			}
			$(".slider-row").css({"height": "15vh"});
		} else  {
			$("input.temp_slider_dual").slider('disable');
			$(".slider-row").css({"height": "20vh"});
		}
	});
	
	self.alwaysAcceptsCommands.subscribe(function(value) {
		if (value) {
			$("input.fan_slider").slider('enable');
		} else {
			$("input.fan_slider").slider('disable');
			action.fan_slider_value(0);
		}
	});
	
	self.cameraAction = function(){
		self.zoom( !self.zoom() );
		return;
		if ( printer.printing() ) {
			self.zoom( !self.zoom() );
		} else {
			self.toggleLights();
		}
	}
	
	self.zoom.subscribe(function(value){
		if (value) {
			touch_ui(true);
		} else {
			if (document.documentElement.clientWidth == window.innerWidth || document.documentElement.scrollWidth == window.innerWidth) { //no "pinch zoom"
				touch_ui(false);
			}
		}
	});
	
	//switches ====================
	self.toggleLights = function(){
		sendSwitchCommand("lights",!self.lights());
	}

	self.togglePower = function(){
		sendSwitchCommand("power",!self.power());
	}

	self.toggleUnload = function(){
		sendSwitchCommand("unload",!self.unload());
	}

	self.togglePowerOff = function(){
		sendSwitchCommand("poweroff",!self.poweroff());
	}

	self.resetPrinter = function(){
		bootbox.confirm({closeButton: false, message: "Reset printer board?", callback: function(result) {
		  if (result) {
			 sendSwitch({"command":"power", "status":false}, function(){
				message("This will take around 30 seconds. Please be patient.");
				sendSwitchCommand("status");
				sendSwitchCommand("reset");
				switchPanel("status");
  			});
		  }
		}});
	}

	self.emergencyStop = function(){
		bootbox.confirm({closeButton: false, message: "STOP ?", callback: function(result) {
		  if (result) {
			sendSwitchCommand("reset");
			switchPanel("status");
		  }
		}});
	}

	self.toggleMute = function (){
		sendSwitchCommand("mute",!self.mute());
	}
	
	self.printerConnect = function(){
		sendConnectionCommand("connect");
		switchPanel("status");
		self.getDefaultProfile();
	}

	self.printerDisconnect = function (){
		bootbox.confirm({closeButton: false, message: "Disconnect?", callback: function(result) {
		  if (result) {
			  sendSwitch({"command":"power", "status":false}, function(){
				sendSwitchCommand("status");
				sendConnectionCommand("disconnect");
				});
		  }
		}});
	}


	self.getDefaultProfile = function() {
		getExtruderCountFromProfile(function(data){		
			current_profile_name = _.compact(_.map(data.profiles, function(obj) { if (obj.current) return obj.id; } ))[0];
			self.current_profile = data.profiles[current_profile_name];
			if (self.current_profile.extruder.count == 1){
				self.dual_extruder(false);
			} else {
				self.dual_extruder(true);
			}
			
		});
	}

	self.hotend_config = ko.computed(function(){
		return self.nozzle_size() + "mm " + self.nozzle_name();
	});

	self.getDefaultProfile();
	
}

var printer;
var action;
var offset;

function applyBindings(){
	printer = new PrinterModel();
	offset = new OffsetModel();
	action = new ActionModel();

	ko.applyBindings(action, document.getElementById("status_panel"));
	ko.applyBindings(action, document.getElementById("printer_panel"));
	ko.applyBindings(action, document.getElementById("movement_panel"));
	ko.applyBindings(printer,document.getElementById("camera_panel"));
	ko.applyBindings(printer,document.getElementById("sidebar"));
	ko.applyBindings(offset, document.getElementById("offset_panel"));
	ko.applyBindings(printer, document.getElementById("disconnected_view"));
	
}


	
