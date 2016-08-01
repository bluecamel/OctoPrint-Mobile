function ActionModel(){

	var self = this;
		
	self.extruder0_slider_value = ko.observable(0);
	self.extruder1_slider_value = ko.observable(0);
	self.bed_slider_value = ko.observable(0);
	
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
			return sprintf(" %0.1fºC", printer.bed_actual());
		} else {
			if (printer.bed_actual() > printer.bed_target()) {
				return sprintf(" %0.1fºC &seArr; %sºC", printer.bed_actual(),  printer.bed_target());
			} else {
				return sprintf(" %0.1fºC &neArr; %sºC", printer.bed_actual(),  printer.bed_target());
			}
		}		
	});
	
	self.extruder_temp = ko.computed(function(){
		var temp = " ";
		if (printer.inProgress()) {
				if (printer.extruder0_target() != 0) {
					if (printer.extruder0_actual() > printer.extruder0_target()) {
						temp += sprintf("%0.1fºC &seArr; %sºC", printer.extruder0_actual(),  printer.extruder0_target());
					}	else {
						temp += sprintf("%0.1fºC &neArr; %sºC", printer.extruder0_actual(),  printer.extruder0_target());
					}
				}
				if (printer.extruder1_target() != 0) {
					if (temp != " ") temp += " | ";
					if (printer.extruder1_actual() > printer.extruder1_target()) {
						temp += sprintf("%0.1fºC &seArr; %sºC", printer.extruder1_actual(),  printer.extruder1_target());
					}	else {
						temp += sprintf("%0.1fºC &neArr; %sºC", printer.extruder1_actual(),  printer.extruder1_target());
					}
				}
				if (temp == " ") {
					temp += sprintf("%0.1fºC", printer.extruder0_actual());
					if ( printer.dual_extruder() && !printer.cyclops() ) {
						temp += sprintf(" | %0.1fºC", printer.extruder1_actual());	
					}
				}
		} else {
			if (printer.extruder0_target() == 0) {
				temp += sprintf("%0.1fºC", printer.extruder0_actual());
			} else {
				if (printer.extruder0_actual() > printer.extruder0_target()) {
					temp += sprintf("%0.1fºC &seArr; %sºC", printer.extruder0_actual(),  printer.extruder0_target());
				}	else {
					temp += sprintf("%0.1fºC &neArr; %sºC", printer.extruder0_actual(),  printer.extruder0_target());
				}
			}
			if ( printer.dual_extruder() && !printer.cyclops() ) {
				temp += " | ";
				if (printer.extruder1_target() == 0) {
					temp += sprintf("%0.1fºC", printer.extruder1_actual());
				} else {
					if (printer.extruder1_actual() > printer.extruder1_target()) {
						temp += sprintf("%0.1fºC &seArr; %sºC", printer.extruder1_actual(),  printer.extruder1_target());
					}	else {
						temp += sprintf("%0.1fºC &neArr; %sºC", printer.extruder1_actual(),  printer.extruder1_target());
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
	
	self.sendBedTemperature = function(){
		if (self.bed_slider_value() == 0) {
			sendCommand(['M140 S0', 'M300 @beep']);
		} else {
			sendCommand(['M140 S'+self.bed_slider_value(), 'M300 @temperature_bed']);
			self.bed_slider_value(0);
			switchPanel("status");
		}
	}

	self.sendExtruder0Temperature = function(){
		if (self.extruder0_slider_value() == 0) {
			sendCommand(['M104 T0 S0', 'M300 @beep']);
		} else {
			sendCommand(['M104 T0 S'+self.extruder0_slider_value(), 'M300 @temperature_extruder']);
			self.extruder0_slider_value(0);
			switchPanel("status");
		}
	}

	self.sendExtruder1Temperature = function(){
		if (self.extruder1_slider_value() == 0) {
			sendCommand(['M104 T1 S0', 'M300 @beep']);
		} else {
			sendCommand(['M104 T1 S'+self.extruder1_slider_value(), 'M300 @temperature_extruder']);
			self.extruder1_slider_value(0);
			switchPanel("status");
		}
	}
	
	self.setFanSpeed = function(){
		if (self.fan_slider_value() == 0) {
			sendCommand('M106 S0');
		} else {
			sendCommand('M106 S'+ Math.floor(255 * self.fan_slider_value()/100) );
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
	
	self.update = function(){
		if (!self.prepared()) {
			self.current_z("reading...");	
			self.offset("reading...");
			sendCommand(["M114", "M851"]);
		}
	}

	self.prepareOffset = function(){
		sendCommand( gcodes_offset.prepare_offset.replace("{{max_m851}}", machine_profile.max_m851).split(",") );
		self.prepared(true);
	}
	
	self.saveOffset = function(){
		sendCommand( gcodes_offset.save_offset.replace("{{z}}", self.current_z()).split(","));
		self.prepared(false);
	}

	self.macro1 = function(){
		sendCommand( gcodes_offset.macro_1.split(","));
	}
	self.macro2 = function(){
		sendCommand( gcodes_offset.macro_2.split(","));
	}
	self.macro3 = function(){
		sendCommand( gcodes_offset.macro_3.split(","));
	}


	self.offsetDone = function(){
		sendCommand( gcodes_offset.offset_done.split(",") );
	}
	
	self.findZero = function(){
		sendCommand( gcodes_offset.find_reference.split(",") );
	}

	self.backLeft = function(){
		sendCommand( gcodes_offset.back_left.split(",") );
	}

	self.frontMiddle = function(){
		sendCommand( gcodes_offset.front_middle.split(",") );
	}

	self.backRight = function(){
		sendCommand( gcodes_offset.back_right.split(",") );
	}
	
	self.sendOffsetAdjustment = function(z){
		if (self.prepared()){
			sendCommand( gcodes_offset.send_relative_z.replace("{{z}}", z).split(",") );
		} else {
			sendCommand( gcodes_offset.save_offset.replace( "{{z}}", ( parseFloat(self.offset()) + parseFloat(z) ) ).split(",") 
			.concat(  gcodes_offset.send_relative_z.replace("{{z}}", z).split(",")  )  );
		}
	}	
}


function PrinterModel(){
	var self = this;
	
	self.port = ko.observable("");
	self.version = ko.observable("");
	self.status =  ko.observable("Offline");
	
	self.zoom =  ko.observable(false);
	
	self.zchange =  ko.observable("");
	
	self.progress = ko.observable(0);
	self.time_elapsed = ko.observable(0);
	self.time_left =  ko.observable(0);
	
	self.aprox_time_left =  ko.computed(function(){
		if (self.time_left() >= 0) {
			return self.time_left();
		} else {
			//aproximate based on percentage
			return self.time_elapsed() * 100 / self.progress() - self.time_elapsed();
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
	
	self.dual_extruder =  ko.observable(false);
	self.cyclops =  ko.observable(false);	
	self.active_extruder =  ko.observable(0);	
	self.hotend_config = ko.observable(null);
	
	self.fileToPrint = ko.observable(null);
	self.fileToPrint.subscribe(function(value) {
		if (value == null) {
			self.fileInfo(null);
			self.hotend_config(null)
		} else {
			getFileInfo(value);
		}
	});
	
	self.fileInfo = ko.observable(null);
	self.fileInfo.subscribe(function(value) {
		if (value != null) {
			self.hotend_config(value.material +" on "+ value.nozzle + "mm "+ value.hotend);
			if (value.hotend.startsWith("cyclops")){
				sendCommand("M890 N1")
			} else {
				sendCommand("M890 N2")
			}
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
	
	self.operational.subscribe(function(value) {		
		if (!value) {
			self.bed_actual(0);
			self.extruder0_actual(0);
			self.extruder1_actual(0);
			self.hotend_config("");
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
	
	
	self.acceptsCommands.extend({ notify: 'always' }); 
	
	self.acceptsCommands.subscribe(function(value) {
		if (value) {
			$("input.temp_slider").slider('enable');
			if (! self.dual_extruder() ) {
				$("input.temp_slider_dual").slider('disable');
			} else {
				if (self.cyclops()){
					$("input.temp_slider_dual").slider('disable');
				} else  {
					$("input.temp_slider_dual").slider('enable');
				}
			}
			$("#tool_select").bootstrapSwitch('disabled', !self.dual_extruder() );

			$(".status_bar").css({"height": "33.34vh", "line-height": "33.34vh"});
			self.progress(0);
		} else {
			$("input.temp_slider").slider('disable');
			action.extruder0_slider_value(0);
			action.extruder1_slider_value(0);
			action.bed_slider_value(0);
			if (currentPanel == 'movement' || currentPanel == 'offset') switchPanel("status");
		}
	});
	
	self.dual_extruder.subscribe(function(value) {
		if (value && self.acceptsCommands()) { 
			if (self.cyclops()){
				$("input.temp_slider_dual").slider('disable');
			} else  {
				$("input.temp_slider_dual").slider('enable');
			}
			$("#tool_select").bootstrapSwitch('disabled', false);
		} 	
	});
	
	self.cyclops.subscribe(function(value) {
		if (value) {
			$("input.temp_slider_dual").slider('disable');
		} else  {
			if (self.dual_extruder() && self.acceptsCommands()) {
				$("input.temp_slider_dual").slider('enable');
			} else {
				$("input.temp_slider_dual").slider('disable');
			}
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

