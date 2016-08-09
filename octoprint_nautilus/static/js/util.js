function formatSeconds(s){
    var date = new Date(1970, 0, 1);
    date.setSeconds(s);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function message(message){
	bootbox.alert({ closeButton: false, className: "bootbox-message", message: message});
}

function info(message){
	bootbox.alert({ closeButton: false, className: "bootbox-info", message: message});
}
