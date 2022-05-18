
import Preloader from './preloader';
import FontsLoader from './fontsloader';
import ResManager from './resmanager';
import View from './view';
import {Display} from './display.1.2';
import { DisplayVars, TextureMap } from './types';

class Main {
	private display:Display;
	private view:View|null=null;
	private preloader:Preloader;
	private resManager:ResManager;
	private fontsLoader:FontsLoader;

	constructor(){
		this.displayChange = this.displayChange.bind(this);
		this.setDisplayLock = this.setDisplayLock.bind(this);
		this.setTouchScroll = this.setTouchScroll.bind(this);
		this.preloadComplete = this.preloadComplete.bind(this);

		this.fontsLoader=new FontsLoader();
		this.display = new Display();
		this.resManager = new ResManager(this.display.getDisplayVars());
		this.preloader = new Preloader(this.resManager,this.preloadComplete);
		this.preloader.startLoad();
		this.fontsLoader.loadFonts();
	}

	preloadComplete(res:TextureMap){
		this.view = new View(res, this.display.getDisplayVars(), this.resManager);
		this.display.setDisplayChangeCallback(this.displayChange);
		this.display.initTicker(this.view);
		this.view.on('setdisplaylock', this.setDisplayLock);//b4 start
		this.view.on('settouchscroll', this.setTouchScroll);
		this.view.start();
	}

	displayChange(dVars:DisplayVars):void{
		this.view?.displayChange(dVars);
	}

	setDisplayLock(lock:boolean):void{
		this.display.setDisplayLock(lock);
	}

	setTouchScroll(canScroll:boolean):void{
		this.display.setTouchScroll(canScroll);
	}

	fontsLoaded():void{
	}
}

document.addEventListener('DOMContentLoaded', () => {
	let main=new Main();
});
