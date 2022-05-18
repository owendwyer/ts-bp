
import {DisplayVars} from './types';
// import { getImageFrames200, getImageFrames200Large, getImageFrames200Huge } from './imagevars-200';

export enum SpriteSize{
	DEFAULT='default',
	LARGE='large',
	HUGE='huge'
}

interface BuildModeType{
	[name: string] : string;
}

const GAME_PAGE = 'page-here';
const IMAGE_SIZE:number=120;

declare const OPD_ENV:string;

const PRELOADER_PATH:BuildModeType = {
	dev: './res/',
	prod: 'https://www.gamestolearnenglish.com/games/dirhere/res/'
};
const AUDIO_PATH: BuildModeType = {
  dev: "./res/audio/",
  prod: 'https://www.gamestolearnenglish.com/content-4/short-audio/use/'
};
const CONTENT_PATH: BuildModeType = {
  dev: "./res/short-images/v1.0/use/",
  prod: 'https://www.gamestolearnenglish.com/content-4/short-images/v1.0/use/'
};

const MAIN_SPRITE_PATH:string = 'mainSprite.0.0.png';
const MAIN_SPRITE_PATH_LARGE:string = 'mainSprite.0.0@1.3x.png';
const MAIN_SPRITE_PATH_HUGE:string = 'mainSprite.0.0@1.6x.png';

const CONTENT_DIR = 'size-140/';

export default class ResManager {
	private spriteSize:SpriteSize;
	private preloaderPath:string;
	private audioPath:string;
	private contentPath:string;

	constructor(dVars:DisplayVars) {
		this.spriteSize=this.setSpriteSize(dVars);
		this.preloaderPath = PRELOADER_PATH[OPD_ENV];
		this.audioPath = AUDIO_PATH[OPD_ENV];
		this.contentPath = CONTENT_PATH[OPD_ENV]+CONTENT_DIR;
	}

	setSpriteSize(dVars:DisplayVars){
		let dpi = window.devicePixelRatio || 1;
		if(dpi>2){
			dpi=2;
		}else{
			if(dpi>1){
				dpi=1+(dpi-1)/2;
			}
		}
		let myScale=dVars.scale*dpi;
		myScale=Math.round(myScale*100)/100;
		if(myScale<1.02)return SpriteSize.DEFAULT;
		if(myScale<1.32)return SpriteSize.LARGE;
		if(myScale<1.6&&PIXI.utils.isMobile.any)return SpriteSize.LARGE;
		return SpriteSize.HUGE;
	}

	// getContentPath(){ return this.contentPath; }
	//
	// getContentTail(){
	// 	if(this.spriteSize===SpriteSize.LARGE)return '@1.3x';
	// 	if(this.spriteSize===SpriteSize.HUGE)return '@1.6x';
	// 	return '';
	// }
	//
	// getContentFramesFunction(){
	// 	if(this.spriteSize===SpriteSize.LARGE)return getImageFrames140Large;
	// 	if(this.spriteSize===SpriteSize.HUGE)return getImageFrames140Huge;
	// 	return getImageFrames140;
	// }

	getPreloaderPath(){
		let myPath=this.preloaderPath;
		if(this.spriteSize===SpriteSize.DEFAULT)myPath += MAIN_SPRITE_PATH;
		if(this.spriteSize===SpriteSize.LARGE)myPath += MAIN_SPRITE_PATH_LARGE;
		if(this.spriteSize===SpriteSize.HUGE)myPath += MAIN_SPRITE_PATH_HUGE;
		return myPath;
	}

	getAudioPath(){ return this.audioPath; }

	getSpriteSize(){ return this.spriteSize; }

	getGamePage(){ return GAME_PAGE;}

	getImageSize(){ return IMAGE_SIZE;}
}
