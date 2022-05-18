import PIXI from "pixi.js";
import { Howl, Howler } from "howler";
import { getAudioSprite } from "./audioframesshort";

interface audioSpriteType { [name: string]: [number, number]; }

const VOLUME_LEVEL:number=0.6;

export default class AudioPlayer extends PIXI.utils.EventEmitter{
  private audioPath:string;
  private retryCount: number = 3;
  private myAudio: Howl | null=null;
  private isAudioExternal: boolean = false;
  private isAudioLoaded: boolean = false;
  private isAudioLoading: boolean = false;
  private externalInd:number=0;
  private externalAudio: (Howl | null)[] = [];
  private isAudioOn:boolean=true;
  private lastAudioInd:number=-1;

  constructor(audioPath:string) {
    super();
    this.audioPath=audioPath;
  }

  //////////////////////////////////////////////////////////////////////////////
  //playing
  playAudio(ind: number, isForced:boolean=false, isReplay:boolean=false) {
    this.stopAudio();
    let playInd=isReplay?this.lastAudioInd:ind;
    this.lastAudioInd=playInd;
    if (this.isAudioOn||isForced) {
      if (this.isAudioLoaded) {
        if(playInd!==-1){
          let snd = "s_" + playInd;
          if (!this.isAudioExternal) {
            this.myAudio?.play(snd);
          } else {
            this.externalInd=playInd;
            this.externalAudio[playInd]?.play();
          }
        }
      }
    }
  }

  stopAudio(): void {
    if (!this.isAudioExternal) {
      this.myAudio?.stop();
    } else {
      this.externalAudio[this.externalInd]?.stop();
    }
  }

  resetLastAudioInd(){
    this.lastAudioInd=-1;
  }

  //////////////////////////////////////////////////////////////////////////////
  //user
  setIsAudioExternal(isAudioExternal: boolean): void {
    this.isAudioExternal = isAudioExternal;
  }

  setExternalAudio(externalAudio: (Howl | null)[]): void {
    this.setIsAudioExternal(true);
    this.externalAudio = externalAudio;
    this.isAudioLoaded = true;
  }

  //////////////////////////////////////////////////////////////////////////////
  //loading
  loadAudio(ind: number): void {
    this.isAudioLoaded = false;
    if (this.isAudioLoading) this.stopCurrentLoad();
    this.isAudioLoading = true;
    this.tryLoad(ind);
  }

  tryLoad(ind: number): void {
    this.unsetAudio();
    let audPath = this.audioPath + "s_" + ind;
    let mySprite: audioSpriteType = getAudioSprite(ind);
    this.myAudio = new Howl({
      src: [audPath + ".ogg", audPath + ".mp3"],
      sprite: mySprite,
      volume:VOLUME_LEVEL,
      onload: () => {
        this.audioLoaded();
      },
      onloaderror: () => {
        this.retryCount -= 1;
        if (this.retryCount < 1) {
          this.audioFailed();
        } else {
          this.tryLoad(ind);
        }
      }
    });
  }

  audioLoaded(): void {
    this.myAudio?.off("load");
    this.myAudio?.off("loaderror");
    this.isAudioLoaded = true;
    this.isAudioLoading = false;
    this.emit('audioloaded',true);
  }

  audioFailed(): void {
    this.isAudioLoading = false;
    this.unsetAudio();
    this.emit('audiofailed',false);
  }

  checkFailed(): void {
    //
  }

  unsetAudio(): void {
    this.myAudio?.off("load");
    this.myAudio?.off("loaderror");
    this.myAudio?.unload();
    this.myAudio = null;
  }

  stopCurrentLoad(): void {
    this.unsetAudio();
    this.isAudioLoading = false;
  }

  //////////////////////////////////////////////////////////////////////////////
  setAudioStatus(status: boolean) {
    this.isAudioOn=status;
    this.stopAudio();
  }

  //////////////////////////////////////////////////////////////////////////////
  checkSuspended(): void {
    if ("ctx" in Howler && Howler.ctx !== null) {
      Howler.ctx.resume();
    }
  }
}
