import PIXI from "pixi.js";
import { Howl, Howler } from "howler";
import { TextureMap } from "../types";

const AUD_ICON_FRAME: string = "audioIcon.png";
const AUDBLACK_ICON_FRAME: string = "audioIconBlack.png";

const BACK_WID:number=48;
const BACK_RND:number=16;
const PLAYBACK_RAD:number=22;
const PLAYBACK_MARG:number=4;

export default class AudioPlayerBase extends PIXI.Container {
  public isAudioOn: boolean = true;
  private showPlayAudioBut: boolean = true;

  private audioBut: PIXI.Container;
  private audioBack: PIXI.Graphics;
  private audioIcon: PIXI.Sprite;
  private playIcon: PIXI.Sprite;

  private playAudioBut: PIXI.Container;
  private playBack: PIXI.Graphics;
  private disabledCross: PIXI.Graphics;
  private loadingText: PIXI.Text;

  constructor(res: TextureMap) {
    super();

    this.toggleAudio = this.toggleAudio.bind(this);
    this.playButClick = this.playButClick.bind(this);

    this.audioBut = new PIXI.Container();
    this.audioBack = new PIXI.Graphics();
    this.audioBack.beginFill(0xcc3300);
    this.audioBack.lineStyle(1, 0x555555);
    this.audioBack.drawRoundedRect(-BACK_WID / 2, -BACK_WID / 2, BACK_WID, BACK_WID, BACK_RND);
    this.audioIcon = new PIXI.Sprite(res[AUD_ICON_FRAME]);
    this.audioIcon.anchor.set(0.5, 0.5);
    this.audioBut.addChild(this.audioBack, this.audioIcon);

    this.playAudioBut = new PIXI.Container();
    this.playBack = new PIXI.Graphics();
    this.playBack.beginFill(0xcccccc);
    this.playBack.lineStyle(1, 0x777777);
    this.playBack.drawCircle(0, 0, PLAYBACK_RAD);
    this.playBack.beginFill(0xffffff);
    this.playBack.lineStyle(1, 0xaaaaaa);
    this.playBack.drawCircle(0, 0, PLAYBACK_RAD - PLAYBACK_MARG);
    this.playIcon = new PIXI.Sprite(res[AUDBLACK_ICON_FRAME]);
    this.playIcon.anchor.set(0.5, 0.5);
    this.playIcon.position.set(0, 0);
    this.playAudioBut.addChild(this.playBack, this.playIcon);
    this.playAudioBut.position.set(-50, 0);

    this.disabledCross = new PIXI.Graphics();
    this.disabledCross.beginFill(0xffffff);
    this.disabledCross.lineStyle(1, 0x2e2e2e);
    this.disabledCross.drawRoundedRect(-5 / 2, -36 / 2, 5, 36, 2);
    this.disabledCross.rotation = -45;
    this.disabledCross.alpha = 0;

    this.loadingText = new PIXI.Text("loading", { fontFamily: "Arial", fontSize: 16, fill: 0x333333, fontWeight: "bold" });
    this.loadingText.anchor.set(0.5, 0.5);
    this.loadingText.position.set(-10, 0);

    this.audioBut.interactive = true;
    this.audioBut.buttonMode = true;
    this.playAudioBut.interactive = true;
    this.playAudioBut.buttonMode = true;
    this.audioBut.on("pointertap", this.toggleAudio);
    this.playAudioBut.on("pointertap", this.playButClick);

    this.loadingText.visible = false;

    this.addChild(this.audioBut, this.playAudioBut, this.loadingText, this.disabledCross);
  }

  toggleAudio(): void {
    if (this.isAudioOn) {
      this.isAudioOn = false;
    } else {
      this.isAudioOn = true;
    }
    this.updateDisplay();
    this.emit("audiostatusupdated", this.isAudioOn);
  }

  playButClick(){
    this.emit('playbutclick');
  }

  updateDisplay(): void {
    if (this.isAudioOn) {
      this.audioIcon.alpha = 1;
      this.disabledCross.alpha = 0;
    } else {
      this.disabledCross.alpha = 1;
      this.audioIcon.alpha = 0.5;
    }
  }

  show(){ this.visible = true; }

  hide(){ this.visible = false; }

  showPlayBut(): void {
    this.showPlayAudioBut = true;
    this.playAudioBut.visible = true;
  }

  hidePlayBut(): void {
    this.showPlayAudioBut = false;
    this.playAudioBut.visible = false;
  }

  showLoading(): void {
    this.audioBut.visible = false;
    this.playAudioBut.visible = false;
    this.loadingText.visible = true;
    this.loadingText.text = "loading";
  }

  unshowLoading(): void {
    this.audioBut.visible = true;
    if (this.showPlayAudioBut) this.playAudioBut.visible = true;
    this.loadingText.visible = false;
  }

  audioFailedBase(){
    this.loadingText.text = "";
  }

  getAudioStatus(): boolean {
    return this.isAudioOn;
  }

  setAudioStatusBase(status: boolean) {
    this.isAudioOn = status;
    this.updateDisplay();
  }

  checkSuspended(): void {
    if ("ctx" in Howler && Howler.ctx !== null) {
      Howler.ctx.resume();
    }
  }
}
