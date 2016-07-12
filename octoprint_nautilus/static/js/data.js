var re114 = /X:([+-]?[0-9.]+) Y:([+-]?[0-9.]+) Z:([+-]?[0-9.]+) E:([+-]?[0-9.]+)/;
var re851 = /echo:Z Offset : ([-.\d]*)/;

function onReceivedData(data){
	if (typeof(data) === "string") {
		data = JSON.parse(data);
	}
	//console.log(data);
	if(typeof(data.current) !== "undefined"){
		onCurrentData(data.current);
	} 
	
	if (typeof(data.history) !== "undefined"){
		onHistoryData(data.history);
	}
	
	if(typeof(data.event) !== "undefined"){
		onEventData(data.event.type, data.event.payload);
	}
	
	if(typeof(data.plugin) !== "undefined"){
		onPluginData(data.plugin.plugin, data.plugin.data);
	}	
}

function onHistoryData(history){
 	//console.log(history);
 	updateFlasgs(history.state.flags);
	
	if (printer.error()){
		printer.status("<marquee behavior='alternate' scrolldelay=10 scrollamount=2>"+history.state.text+"</marquee>");
		printer.operational(false);
	} else {
		printer.status(history.state.text);
	}	
}

function onCurrentData(current){
	// uppdate printer status
	//console.log(current);	
	updateFlasgs(current.state.flags);
	
	if (printer.error()){
		printer.status("<marquee behavior='alternate' scrolldelay=10 scrollamount=2>"+current.state.text+"</marquee>");
		printer.operational(false);
	} else {
		printer.status(current.state.text);
	}
	
	printer.fileToPrint(current.job.file.name);

	onMessageData(current.messages);
	
	if(typeof(current.temps[0]) !== "undefined"){
		printer.bed_actual(current.temps[0].bed.actual);
		printer.bed_target(current.temps[0].bed.target);
		printer.extruder0_actual(current.temps[0].tool0.actual);
		printer.extruder0_target(current.temps[0].tool0.target);
		if ( current.temps[0].tool1.actual == null) {
			printer.dual_extruder(false);
			printer.extruder1_actual(0);
			printer.extruder1_target(0);
		} else {
			printer.dual_extruder(true);
			printer.extruder1_actual(current.temps[0].tool1.actual);
			printer.extruder1_target(current.temps[0].tool1.target);
		}
	}
		
	if(current.state.flags.printing){
		//console.log(formatSeconds(current.progress.printTimeLeft));
		printer.progress(parseFloat(current.progress.completion));
		
		printer.time_elapsed(parseInt(current.progress.printTime));
		
		if(current.progress.printTimeLeft != null){
			printer.time_left(parseInt(current.progress.printTimeLeft));
		}
	}
}

function updateFlasgs(flags){
	//whether the printer is currently connected and responding
	printer.operational(flags.operational);
	//whether the printer is currently printing>
	printer.printing(flags.printing);
	//whether the printer is currently disconnected and/or in an error state	
	printer.closedOrError(flags.closedOrError);
	//whether the printer is currently in an error state
	printer.error(flags.error);
	//whether the printer is currently paused
	printer.paused(flags.paused);
	//whether the printer is operational and ready for jobs
	printer.ready(flags.ready);
}

function onMessageData(messages){
	//console.log(currentPanel);
	if (currentPanel == "offset") {
		var m;
		if ((m = re851.exec(messages)) !== null) {
			//console.log(m);
			offset.offset(m[1]);
		} 
		if ((m = re114.exec(messages)) != null) {
			//console.log(m);
			if ( offset.prepared() ) {
				offset.current_z(   (parseFloat(m[3]) + parseFloat(machine_profile.max_m851)).toFixed(2) );
			} else {
				offset.current_z(m[3]);	
			}
		}
	}
}

function onEventData(type, payload) {
	//console.log("Event '"+type + "': ", payload);
	switch (type) {
		case "Connected":
			printer.port(payload.port);
			break;
	}
}


function onPluginData(name, data){
	//console.log("Plugin '"+ name + "': ", data);
	switch (name) {
		 case "switch":
			printer.power(JSON.parse(data.power)); //convert to boolean
			printer.lights(JSON.parse(data.lights));
			printer.mute(JSON.parse(data.mute));
			printer.unload(JSON.parse(data.unload));
			printer.poweroff(JSON.parse(data.poweroff));
			break;
		case "mobile":
			if ( typeof(data.message) !== "undefined") {
				message(data.message);
			} 
			if ( typeof(data.zchange) !== "undefined") {
				if (data.zchange == "") {
					printer.zchange("");
				} else {
					printer.zchange(data.zchange+"mm");
				}
			} 
			if ( typeof(data.marlin_estimate) !== "undefined") { 
				printer.marlin_estimate(data.marlin_estimate);
			}
			if ( typeof(data.port) !== "undefined") { 
				printer.port(data.port);
			}
			if ( typeof(data.tool) !== "undefined") { 
				printer.active_extruder(data.tool);
				if (data.tool == "0"){
					$("#tool_select").bootstrapSwitch('state', true, true);
				} else {
					$("#tool_select").bootstrapSwitch('state', false, true);
				}
			}
			if ( typeof(data.hotend) !== "undefined") { 
				if (data.hotend == "single"){
					printer.cyclops(true);
				} else {
					printer.cyclops(false);
				}
			}
			break;
		case "status_line":
			message(data.status_line);
			break;
	}
}