var currentView;
var currentPanel;

function switchView(view) {
	if ( currentView != view ){
		if (view == "main") {
			switchPanel("status");
		}
		$(".view").hide();
		$("#"+view+"_view").show();
		currentView = view;
	}
}

function switchPanel(panel){
	if ( currentPanel != panel ){		

		$(".sidebar-nav-selected").removeClass("sidebar-nav-selected");
		$("#"+panel+"_btn").addClass("sidebar-nav-selected");

		$(".panel").hide();
		$("#"+panel+"_panel").show();
		
		if (currentPanel == "camera") {
			stop_camera(false); //stop streaming, but not imediate
		} 
		currentPanel = panel;
	}
}

// tab menu buttons
$("#status_btn").click(function() {
	switchPanel("status");
});

$("#printer_btn").click(function() {
	switchPanel("printer");
});

$("#movement_btn").click(function() {
	if (printer.acceptsCommands()){
		switchPanel("movement");
	}
});

$("#offset_btn").click(function() {
	if (printer.acceptsCommands()){
		switchPanel("offset");
		offset.update(); //update z and z offset values
	}
});

$("#camera_btn").click(function() {
	start_camera();
});


$("#tool_select").bootstrapSwitch({
		onText: "left",
		onColor: "success",
		offColor: "success",
		offText: "right",
		labelText: "extruder",
		handleWidth: 12,
		labelWidth: 18,
		size: "large",
		disabled: true,
		animate: false,

		onSwitchChange: function(event, state){
			if(state){
				sendCommand('T0');
			} else {
				sendCommand('T1');
			}
		}
	});

var touch_start;	
function touch_ui(touch) {
	if (touch){
		document.ontouchmove = function(event){
			return true;
		};
		var vp = document.getElementById('vp');
		vp.content = "width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes";
		
		$("#main_view").append($("#camera_panel").remove());
		$("#wrapper").hide();

		$("#webcam").css({"height": "100%", "width": SCREEN_WIDTH});
		
	} else {

		document.ontouchstart = function(event) {
			if ( $(event.target).hasClass("bootbox-body") ) {
				touch_start = event.touches[0].clientY;
			}
		}

		document.ontouchmove = function(event){
			if ( $(event.target).hasClass("bootbox-body") ) {
				var t = $(event.target);
				if (touch_start > event.changedTouches[0].clientY) {
					//scrool down
					return t.scrollTop() < t.get(0).scrollHeight - t.get(0).offsetHeight;
				} else {
					//scrool up
					if ( t.scrollTop() == 0 ) {
						return false;
					} else {
						return true;
					}
				}
			} else {
				return false;
			}
		};

		var vp = document.getElementById('vp');
		vp.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
	
		$("#webcam").css({"height": SCREEN_HEIGHT, "width": "100%"});
		$("#main").append($("#camera_panel").remove());
		$("#wrapper").show();
		window.scrollTo(0,0);
	}
	setup_camera_click();
}


//remap click after add/remove html element
function setup_camera_click() {
    // Remove handler from existing elements
    $("#webcam").off(); 

    // Re-add event handler for all matching elements
    $("#webcam").on("click", function() {
        printer.cameraAction();
		return false;
    });
}
