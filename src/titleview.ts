import PIXI from 'pixi.js';
import AbstractView from './abstractview';
import { DisplayVars, TextureMap } from './types';

export default class TitleView extends AbstractView {
	private tmpText:PIXI.Text;
	private viewFade:GSAPTween;

	constructor(res:TextureMap, dVars:DisplayVars) {
		super();
		this.tmpText=new PIXI.Text('working',{
			fontFamily:'Alegreya Sans, Arial',
			fontWeight: 'bold',
			fontSize:25,
			fill:0x333333
		});
		this.tmpText.anchor.set(0.5);
		this.tmpText.resolution=1;

		this.viewFade=gsap.to(this,{alpha:1,duration:0.3,delay:0.2,paused:true});

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
		this.alpha=0;
		this.viewFade.restart(true);
	}

	stop() {
	}
}
