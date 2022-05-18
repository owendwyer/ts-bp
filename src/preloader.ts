/// <reference path="opdPreloader.d.ts"/>
import * as opdPreloader from 'opdPreloader';
import PIXI from 'pixi.js';
import ResManager, {SpriteSize} from './resmanager';
import {TextureMap, DisplayVars} from './types';
import mySpriteData from './jsons/mySprite.json';
import mySpriteDataLarge from './jsons/mySprite@1.3x.json';
import mySpriteDataHuge from './jsons/mySprite@1.6x.json';

export default class Preloader {
	private callBack:Function;
	private tryTimes:number;
	private loader:PIXI.Loader;
	private onErrorId:PIXI.Loader.ICallbackID;
	private onCompleteId:PIXI.Loader.ICallbackID;
	private spriteSize:SpriteSize=SpriteSize.DEFAULT;
	private resPath:string;

	constructor(resManager:ResManager,callBack:Function) {
		this.resPath=resManager.getPreloaderPath();
		this.spriteSize=resManager.getSpriteSize();
		this.callBack = callBack;
		this.tryTimes = 3;
		this.loader = new PIXI.Loader();
		this.loaded = this.loaded.bind(this);
		this.gotError = this.gotError.bind(this);
	}

	startLoad():void{
		this.loader.add('main', this.resPath);
		this.onErrorId=this.loader.onError.add(this.gotError);
		this.onCompleteId=this.loader.onComplete.add(this.loaded);
		this.loader.load();
	}

	gotError(e:string):void{
		this.clearUp();
		this.tryTimes -= 1;
		if (this.tryTimes > 0) {
			this.startLoad();
			console.log('load error, retrying', e);
		} else {
			console.log('load error, giving up', e);
			opdPreloader.loadFailed();
		}
	}

	loaded():void{
		opdPreloader.clearAll();

		let spriteData={};
		if(this.spriteSize===SpriteSize.DEFAULT)spriteData=mySpriteData;
		if(this.spriteSize===SpriteSize.LARGE)spriteData=mySpriteDataLarge;
		if(this.spriteSize===SpriteSize.HUGE)spriteData=mySpriteDataHuge;

		let mySheet = new PIXI.Spritesheet(
			this.loader.resources.main.texture.baseTexture, spriteData
		);
		mySheet.parse((map:TextureMap) => {
			this.callBack(map);
			this.clearUp();
		});
	}

	clearUp():void{
		this.loader.onError.detach(this.onErrorId);
		this.loader.onComplete.detach(this.onCompleteId);
		this.loader.destroy();
	}
}
