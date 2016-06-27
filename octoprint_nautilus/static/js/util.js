function formatSeconds(s){
    var date = new Date(1970, 0, 1);
    date.setSeconds(s);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function message(message){
	settings = {
		type: 'danger',
		allow_dismiss: true,
		delay: 30000,
		placement: {
				from: "bottom",
				align: "center"
			}
	};
	$.notify(message, settings);
}

function info(message){
	settings = {
		type: 'info',
		allow_dismiss: true,
		delay: 30000,
		placement: {
				from: "bottom",
				align: "center"
			}
	};
	$.notify(message, settings);
}
