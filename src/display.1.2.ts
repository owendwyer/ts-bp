import PIXI from 'pixi.js';
import View from './view';
import {DisplayVars} from './types';

const DEF_WIDTH = 800;
const DEF_HEIGHT = 550;
const Y_MARGIN_LAND = 60;
const Y_MARGIN_PORT = 20;
const CANVAS_ID:string = 'myCanvas';//this is needed for highscorenentryinputs
const CONTAINER_DIV:string = 'containerDiv';

export class Display {
	private displayChange:Function=()=>{};
	private displaVars:DisplayVars;
	private locked:boolean;
	private lockedUpdateFlag:boolean;
	private devicePixelRatio:number;
	private renderer:PIXI.Renderer | PIXI.CanvasRenderer;
	private myContainer: HTMLElement | null;

	constructor() {

		this.windowResize = this.windowResize.bind(this);
		this.myContainer = document.getElementById(CONTAINER_DIV);

		this.devicePixelRatio = window.devicePixelRatio || 1;
		if(this.devicePixelRatio>2){
			this.devicePixelRatio=2;//limit to 2
		}else{
			if(this.devicePixelRatio>1){
				this.devicePixelRatio=1+(this.devicePixelRatio-1)/2;
			}
		}
		this.devicePixelRatio=Math.round(this.devicePixelRatio*100)/100;
		// this.devicePixelRatio=1;

		this.displaVars=this.makeDisplayVars();

		this.locked = false;
		this.lockedUpdateFlag = false;
		this.renderer=this.getRenderer();
		this.renderer.resize(this.displaVars.width, this.displaVars.height);

		PIXI.settings.ROUND_PIXELS = true;
		this.renderer.view.id = CANVAS_ID;

		//open pr about this?
		this.renderer.plugins.interaction.interactionFrequency = PIXI.utils.isMobile.any ? 100000 : 10;
		this.myContainer?.appendChild(this.renderer.view);

		this.setTouchScroll(true);
		window.addEventListener('resize', this.windowResize);
	}

	setDisplayChangeCallback(displayChange:Function){
		this.displayChange = displayChange;
	}

	initTicker(view:View) {
		let ticker = new PIXI.Ticker();
		let myFPS = PIXI.utils.isMobile.any ? 30 : 60;
		ticker.maxFPS = myFPS;
		//ticker.maxFPS = 30;
		ticker.add(() => {
			this.renderer.render(view);
		}, PIXI.UPDATE_PRIORITY.LOW);
		ticker.start();
	}

	windowResize() {
		if (!this.locked) {
			this.displaVars=this.makeDisplayVars();
			this.renderer.resize(this.displaVars.width, this.displaVars.height);
			this.displayChange(this.displaVars);
		} else {
			this.lockedUpdateFlag = true;
		}
	}

	setTouchScroll(canScroll:boolean) {
		if (canScroll) {
			this.renderer.plugins.interaction.autoPreventDefault = false;
			this.renderer.view.style.touchAction = 'auto';
		} else {
			this.renderer.plugins.interaction.autoPreventDefault = true;
			this.renderer.view.style.touchAction = 'none';
		}
	}

	setDisplayLock(lock:boolean) {
		this.locked = lock;
		if (this.lockedUpdateFlag) this.windowResize();
		this.lockedUpdateFlag = false;
	}

	makeDisplayVars() {
		let winWid = this.myContainer===null?0:this.myContainer.clientWidth;
		let winHei = window.innerHeight;
		let curOrient = this.displaVars?this.displaVars.orient:-1;
		let orient = winWid > winHei ? 0 : 1;
		let orientChanged=curOrient!==orient;
		let aspectRatio = orient === 0 ? DEF_WIDTH / DEF_HEIGHT : DEF_HEIGHT / DEF_WIDTH;
		let width = 0;
		let height = 0;
		let yMargin = orient === 0 ? Y_MARGIN_LAND : Y_MARGIN_PORT;
		if (winWid / winHei > aspectRatio) { //window height limits size of canvas
			height = Math.round(winHei - yMargin);
			width = Math.round(height * aspectRatio);//set width according to height
		} else { //window width limits size of canvas
			width = winWid;
			height = Math.round(width / aspectRatio);//set height according to width
			if (height + yMargin > winHei) { //height according to width is too big
				height = Math.round(winHei - yMargin);//adjust height to fit
				width = Math.round(height * aspectRatio);//set width according to height
			}
		}
		let scale = orient=== 0 ? width / DEF_WIDTH : width / DEF_HEIGHT;
		scale = Math.round(1000 * scale) / 1000;

		//is this right?

		let textResolution = scale * this.devicePixelRatio;
		textResolution = Math.round(100 * textResolution) / 100;
		if (textResolution < 1) textResolution = 1;

		return {orient,scale,orientChanged,width,height,textResolution};
	}

	getDisplayVars():DisplayVars{ return this.displaVars; }

	getRenderer():PIXI.Renderer|PIXI.CanvasRenderer{
		let rendererOptions = {
			width: DEF_WIDTH,
			height: DEF_HEIGHT,
			transparent: true,
			antialias: true,
			autoDensity: true,
			resolution: this.devicePixelRatio
		};

		if (PIXI.utils.isWebGLSupported()) {
		//if (false) {
			return new PIXI.Renderer(rendererOptions);
		} else {
			return new PIXI.CanvasRenderer(rendererOptions);
		}
	};
}
