$(document).ready(function() {
	switchView("loading");
});

function load() {
	if ( home ) {
		// no scrolling
		touch_ui(false);
		
		
		getConnectionStatus(function(data) {
			printer.port(data.current.port);
		 });

		 connect();
		 
		 //hack to fix camera size. not sure why this works :D
		 printer.zoom(false);
		 printer.zoom(true);
		 printer.zoom(false);
		 
	} else {
		// allow scrolling
		document.ontouchmove = function(event){
			return true;
		};
		var vp = document.getElementById('vp');
		vp.content = "width=device-width, maximum-scale=10,user-scalable=yes";
		
		start_camera(true);
	}
}

$("#reconnect").click(function(){
	connect();
});

function start_camera(alone){
	d = new Date();
	if (alone) {
		switchView("camera");
		$("#webcam_alone").attr("src", BASE_URL+"webcam/?action=stream&"+d.getTime());
	} else {
		switchPanel("camera");
		if (clearCameraTimeout()) {
			$("#webcam").attr("src", BASE_URL+"webcam/?action=stream&"+d.getTime());	
		} 
	}
}

function stop_camera(imediate){
	if (imediate) {
		clearCameraTimeout();
		window.stop();		
	} else {
		setCameraTimeout(); 
	}
}

var camera_timeout;

function clearCameraTimeout(){
	//console.log(camera_timeout);
	if (camera_timeout == undefined) return true;
	clearTimeout(camera_timeout);
	camera_timeout = undefined;
	//console.log("cleared");
	return false;
}

function setCameraTimeout(){
	//console.log("set");
	camera_timeout = setTimeout(function(){
		//console.log("triggered");
		camera_timeout = undefined; 
		window.stop();
	}, 10000); //stop after X seconds
} 

//called by ios app 
function initialize(apikey){
	$.ajaxSetup({
		headers: { 'X-Api-Key': apikey },
		timeout: 10000,
		contentType: "application/json"
	});
	applyBindings();
	
	checkHome(function(data){
		home = data.home;
		load();
	});
}

function onForeground(){
	checkHome(function(data){
		var new_home = data.home;
		if ( new_home == home) { //didn't change location
			if ( ! new_home ) { //we're away 
				start_camera(true);
			} else {
				connect();
			}
		} else { //we moved in or out the house, run setup for new environment
			home = new_home;
			initialize();
		}
	});
}

//called by ios app 
function onBackground(){
	if (home) {
		touch_ui(false);
		bootbox.hideAll();
		disconnect();
	} else {
		stop_camera(true); //stop camera immediately
	}
}


