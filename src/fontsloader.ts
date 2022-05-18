import webfontloader from "webfontloader";

class FontsLoader {
	private callBack:Function | undefined;
	public areFontsLoaded:boolean;

	constructor() {
		this.areFontsLoaded = false;
	}

	addCallback(callBack:Function){
		if(this.areFontsLoaded){
			callBack();
		}else{
			this.callBack=callBack;
		}
	}

	loadFonts() {
		webfontloader.load({
			google: {
				families: ["Alegreya+Sans:wght@700", "ABeeZee"]
			},
			// active: () => {
			// 	this.areFontsLoaded = true;
			// 	if(this.callBack!==undefined)this.callBack();
			// }
		});
	}
}

export default FontsLoader
