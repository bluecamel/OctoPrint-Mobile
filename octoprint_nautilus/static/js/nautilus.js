$(function() {
	function NautilusViewModel(models) {
		var self = this;
		
		self.global_settings = models[0];

		self.onAllBound = function() {
			if ( navigator.userAgent.match(/ipad|iphone|android/i) ) {
				//show on top
				var element = $("#navbar_plugin_announcements");
				if (element.length) {
					element.after("<li><a href='/?apikey="+self.global_settings.api_key()+"&nautilus=true'><i class='icon-mobile-phone' style='font-size: 1.4em;'></i>&nbsp;</a></li>");
				}
			} else {
				//small link next to version at the bottom
				var element = $(".footer li:eq(1)");
				console.log(element);
				if (element.length) {
					element.after("<li><a href='/?apikey="+self.global_settings.api_key()+"&nautilus=true'><i class='icon-mobile-phone'></i> Nautilus</a></li>");
				}
			}
		};
	}
	ADDITIONAL_VIEWMODELS.push([NautilusViewModel, ["settingsViewModel"], []]);
});
