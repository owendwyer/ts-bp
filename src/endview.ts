import PIXI from 'pixi.js';
import AbstractView from './abstractview';
import { DisplayVars, TextureMap } from './types';

export default class EndView extends AbstractView {
	private tmpText:PIXI.Text;

	constructor(res:TextureMap, dVars:DisplayVars) {
		super();
		this.tmpText=new PIXI.Text('EndView 1',{
			fontFamily:'Alegreya Sans, Arial',
			fontWeight: 'bold',
			fontSize:25,
			fill:0x333333
		});
		this.tmpText.anchor.set(0.5);
		this.tmpText.resolution=1;
		this.addChild(this.tmpText);

		this.setupDisplay(dVars);
	}

	setupDisplay(dVars:DisplayVars){
		if(dVars.orient===0){
			this.tmpText.position.set(400,275);
		}else{
			this.tmpText.position.set(275,400);
		}
		this.tmpText.resolution = dVars.textResolution;
	}

	displayChange(dVars:DisplayVars){
		this.setupDisplay(dVars);
	}

	start() {
	}

	stop() {
	}
}
