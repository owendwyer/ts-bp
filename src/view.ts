import PIXI from 'pixi.js';
import gsap from 'gsap';

import Background from './background';
import AudioButton from './general/audiobutton.0.4';
import AudioPlayer from './audio/audioplayershort.0.5';

import AbstractView from './abstractview';
import TitleView from './titleview';
import EndView from './endview';

import { getHashObj, hashObjType } from './hashchecker.2.2';
import { DisplayVars, TextureMap } from './types';
import ResManager, {SpriteSize} from './resmanager';

export default class View extends PIXI.Container {
	private background:Background;
	private audioButton:AudioButton;

	private audioPlayer:AudioPlayer;

	private currentView:AbstractView;
	private nextView:AbstractView;

	private titleView:TitleView;
	private endView:EndView;

	constructor(res:TextureMap, dVars:DisplayVars, resManager:ResManager) {
		super();

		this.audioContextCheck = this.audioContextCheck.bind(this);//all binds to sep function

		this.background = new Background(res, dVars);
		this.scale.set(dVars.scale);

		this.audioPlayer = new AudioPlayer(resManager.getAudioPath());
		this.audioButton = new AudioButton(res);
		this.audioButton.hidePlayBut();

		this.addChild(this.background,this.audioButton);

		this.currentView = new AbstractView();
		this.nextView = new AbstractView();

		this.titleView = new TitleView(res, dVars);
		this.endView = new EndView(res, dVars);

		this.setupDisplay(dVars);

		this.setBinds();
		this.addLists();
	}

	setupDisplay(dVars:DisplayVars) {
		if (dVars.orient === 0)this.audioButton.position.set(765, 35);
		else this.audioButton.position.set(513, 37);
	}

	displayChange(dVars:DisplayVars) {
		this.scale.set(dVars.scale);
		if (dVars.orientChanged) {
			this.setupDisplay(dVars);
			this.background.displayChange(dVars);
			this.titleView.displayChange(dVars);
			this.endView.displayChange(dVars);
		}
	}

	start(){
		this.showTitle();
	}

	/////////////////////////////////////////////////////////////////////////////
	//views
	// this.emit('setdisplaylock', false);//for when coming from endview

	showTitle() {
		this.audioButton.show();
		this.nextView = this.titleView;
		this.changeView();
		this.emit('settouchscroll', true);
	}

	closeTitle(){
		this.emit('settouchscroll', false);
	}

	changeView() {
		this.currentView.stop();
		this.removeChild(this.currentView);
		this.currentView = this.nextView;
		this.addChild(this.currentView);
		this.currentView.start();
	}
	//////////////////////////////////////////////////////////////////////////////

	audioContextCheck() {
		this.audioPlayer.checkSuspended();
		this.interactive = false;
		this.off('pointerdown', this.audioContextCheck);
	}

	addLists() {
		this.interactive = true;
		this.on('pointerdown', this.audioContextCheck);
	}

	setBinds(){

	}
}
