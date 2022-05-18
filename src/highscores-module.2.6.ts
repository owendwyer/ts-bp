import PIXI from 'pixi.js';
import gsap from 'gsap';

interface GameData{
	score: number,
	time: number,
	moves: number,
	contentCode: number|null,
	contentTitle: string,
	playerName: string,
	playerLocation: string,
	maxScore: number
}

interface responseType{
	response:HSScoresLine[],
	userInsert:number
}

class HighScores extends PIXI.Container {
	private OFFLINE_LEN:number=6;
	private scores:HSObject;
	private settings:HSSettings;
	private gameData:GameData;
	private highScoresView:HighScoresView;
	private highScoresLoader:HighScoresLoader;

	constructor(dVars:DisplayVars, scores:HSObject, settings:HSSettings, dSettings:HSDisplaySettings) {
		super();
		this.submitClick = this.submitClick.bind(this);
		this.gotScores = this.gotScores.bind(this);
		this.scores = scores;
		this.settings = settings;
		this.gameData = {
			score: 0, time: 0, moves: 0, contentCode: null, contentTitle: '', playerName: 'You', playerLocation: 'Home', maxScore: 0
		};
		this.highScoresView = new HighScoresView(dVars, scores, settings, dSettings);
		this.highScoresLoader = new HighScoresLoader(settings);
		this.highScoresLoader.on('gotscores', this.gotScores);
		this.addChild(this.highScoresView);
	}

	displayChange(dVars:DisplayVars):void{
		this.highScoresView.displayChange(dVars);
	}

	updateInputs(dVars:DisplayVars):void{
		this.highScoresView.updateInputs(dVars);
	}

	getScores():void{
		this.highScoresView.gettingScores();
		this.highScoresLoader.getScores(false, this.gameData);
	}

	gotScores(responseText:responseType):void{
		this.processJson(responseText);
		let dSeq = this.getDisplaySeq();
		if (this.highScoresView.isSubmitSent()) this.ensurePlayerShowing(dSeq);
		this.highScoresView.setDisplaySeq(dSeq);
		this.highScoresView.gotScores();
	}

	setPlayerScores(score1:number, score2:number):void{
		if(this.settings.SCORE_TYPE[0]==='score')this.gameData.score=score1;
		if(this.settings.SCORE_TYPE[0]==='time')this.gameData.time=score1;
		if(this.settings.SCORE_TYPE[0]==='moves')this.gameData.moves=score1;
		if(this.settings.SCORE_TYPE.length>1){
			if(this.settings.SCORE_TYPE[1]==='score')this.gameData.score=score2;
			if(this.settings.SCORE_TYPE[1]==='time')this.gameData.time=score2;
			if(this.settings.SCORE_TYPE[1]==='moves')this.gameData.moves=score2;
		}
		this.highScoresView.setScoresPane(this.settings.SCORE_TYPE[0], score1);
		this.addPlayerToOfflineScores();
	}

	setGameData(contentCode:number, contentTitle:string, maxScore:number):void{
		this.gameData.contentCode=contentCode;
		this.gameData.contentTitle=contentTitle;
		this.gameData.maxScore=maxScore;
		this.highScoresView.setContentTitle(contentTitle);
	}

	getDisplaySeq():number[]{ //determines which sets of scores to display - all, monthly, weekly or 24hrs
		if (this.scores[2].length < 5) return [1];//just all
		if (this.scores[4].length > 4) return [1, 2, 4];//all, monthly, 24hrs
		if (this.scores[3].length > 4) return [1, 2, 3];//all, monthly, weekly
		return [1, 2];//all & monthly
	}

	submitClick(nom:string, loc:string):void{
		this.gameData.playerName = nom;
		this.gameData.playerLocation = loc;
		this.highScoresLoader.getScores(true, this.gameData);
	}

	processJson(responseText:responseType):void{
		let myJson = responseText.response;
		let userId = responseText.userInsert;
		let lim = 50;
		let times = [0, 0, 0, 0, 0];
		let pPos = [-1, -1, -1, -1, -1];

		let now = new Date();
		now.setDate(now.getDate() - 1);
		times[4] = now.getTime();
		now.setDate(now.getDate() - 6);
		times[3] = now.getTime();
		now.setDate(now.getDate() - 23);
		times[2] = now.getTime();

		for (let j = 1; j < 5; j++) this.scores[j] = [];

		for (let i = 0; i < myJson.length; i++) {
			if (myJson[i].score > this.gameData.maxScore)myJson[i].score = this.gameData.maxScore;//remove cheaters
			let uMatch = userId === myJson[i].id;
			let leDate = new Date(myJson[i].dote);
			let uTime = leDate.getTime();
			for (let j = 1; j < 5; j++) {
				if (this.scores[j].length < lim && uTime > times[j]) {
					if (uMatch) pPos[j] = this.scores[j].length;
					this.scores[j].push(myJson[i]);
				}
			}
		}
		for (let i = 1; i < pPos.length; i++) this.highScoresView.setPlayerPosition(i, pPos[i]);
	}

	addPlayerToOfflineScores():void{
		this.scores[0][this.OFFLINE_LEN-1] = this.makePlayerLine(false);
		this.scores[0].sort(this.compare.bind(this));
		let pPos = this.scores[0].map((e) => e.nom).indexOf('You');
		this.highScoresView.setPlayerPosition(0, pPos);
	}

	ensurePlayerShowing(dSeq:number[]):void{
		let sInd = dSeq[dSeq.length - 1];
		if (this.highScoresView.getPlayerPosition(sInd) === -1) {
			this.scores[sInd][49] = this.makePlayerLine(true);
			this.highScoresView.setPlayerPosition(sInd, 49);
		}
	}

	makePlayerLine(fullYear:boolean):HSScoresLine{
		let myDate = new Date();
		let playerDate = fullYear ? myDate : myDate.getFullYear();
		let line:HSScoresLine = {
			dote : playerDate.toString(),
			nom : this.gameData.playerName,
			local : this.gameData.playerLocation,
			id:7,
			score : this.gameData.score,
			time : this.gameData.time,
			moves : this.gameData.moves
		};
		return line;
	}

	compare(a:HSScoresLine, b:HSScoresLine):number{
		//this is only used when adding player score
		let sType = this.settings.SCORE_TYPE[0];
		if(sType==='score'){
			if(a.score>b.score)return -1;
			if(a.score<b.score)return 1;
		}
		if(sType==='time'){
			if(a.time>b.time)return 1;
			if(a.time<b.time)return -1;
		}
		if(sType==='moves'){
			if(a.moves>b.moves)return 1;
			if(a.moves<b.moves)return -1;
		}
		if (this.settings.SCORE_TYPE.length > 1) {
			sType = this.settings.SCORE_TYPE[1];
			if(sType==='score'){
				if(a.score>b.score)return -1;
				if(a.score<b.score)return 1;
			}
			if(sType==='time'){
				if(a.time>b.time)return 1;
				if(a.time<b.time)return -1;
			}
			if(sType==='moves'){
				if(a.moves>b.moves)return 1;
				if(a.moves<b.moves)return -1;
			}
		}
		return 0;
	}

	start():void{
		this.highScoresView.start();
		this.highScoresView.on('submitclick', this.submitClick);
	}

	stop():void{
		this.highScoresView.stop();
		this.highScoresView.off('submitclick');
	}
}

export default HighScores;


class HighScoresView extends PIXI.Container {

	private SEQ_LIM = 30;//bounds for set sequence timer
	private SEQ_START = 12;
	private SEQ_LOW = -10;

	private orient:number;
	private scores:HSObject;
	private dSettings:HSDisplaySettings;
	private active:boolean=false;
	private scoresReceived:boolean=false;
	private submitSent:boolean=false;
	private displayInd:number=0;
	private playerPositions:number[];
	private displaySeq:number[]=[0];
	private incDisplayInd:boolean=true;
	private showEntryPaneFlag:boolean=false;
	private myTimer:number|null=null;
	private yOffs:number[]=[];
	private timerCount:number=0;

	private fadeInEntry:GSAPTween;
	private fadeInScores:GSAPTween;

	private highScoresTable:HighScoresTable;
	private highScoresTableLines:HighScoresTableLines;
	private highScoresScoresPane:HighScoresScoresPane;
	private highScoresArrows:HighScoresArrows;
	private highScoresSeqArrows:HighScoresSeqArrows;
	private highScoresEntryPane:HighScoresEntryPane;

	constructor(dVars:DisplayVars, scores:HSObject, settings:HSSettings, dSettings:HSDisplaySettings) {
		super();
		this.scrollUp = this.scrollUp.bind(this);
		this.scrollDown = this.scrollDown.bind(this);
		this.seqNext = this.seqNext.bind(this);
		this.seqPrev = this.seqPrev.bind(this);
		this.myCounter = this.myCounter.bind(this);
		this.submitClick = this.submitClick.bind(this);

		this.orient = dVars.orient;
		this.scores = scores;
		this.dSettings = dSettings;

		this.playerPositions = [-1, -1, -1, -1, -1];

		this.highScoresTable = new HighScoresTable(dVars, dSettings);
		this.highScoresTableLines = new HighScoresTableLines(dVars, settings, dSettings);
		this.highScoresScoresPane = new HighScoresScoresPane(dVars, dSettings);
		this.highScoresArrows = new HighScoresArrows(dVars, dSettings);
		this.highScoresSeqArrows = new HighScoresSeqArrows(dSettings);
		this.highScoresEntryPane = new HighScoresEntryPane(dVars, dSettings);

		this.highScoresEntryPane.alpha = 0;
		this.highScoresScoresPane.alpha = 0;
		this.fadeInEntry = gsap.to(this.highScoresEntryPane, { delay: 0.2, duration: 0.5, alpha: 1 });
		this.fadeInScores = gsap.to(this.highScoresScoresPane, { delay: 0.2, duration: 0.5, alpha: 1 });

		this.addChild(this.highScoresTable, this.highScoresTableLines, this.highScoresArrows);
		this.addChild(this.highScoresSeqArrows, this.highScoresScoresPane);
		this.addChild(this.highScoresEntryPane);

		this.setupDisplay(dVars);
	}

	setupDisplay(dVars:DisplayVars) {
		let xPos = dVars.orient === 0 ? 400 : 275;
		let yPos = dVars.orient === 0 ? 210 : 274;
		yPos += this.dSettings.adjustYs[dVars.orient];
		this.highScoresTable.position.set(xPos, yPos);
		this.highScoresTableLines.position.set(xPos, yPos - 59);
		this.highScoresSeqArrows.position.set(xPos, yPos - 140);
		let entryPaneX = dVars.orient === 0 ? 68 : 275;
		let entryPaneY = dVars.orient === 0 ? yPos + 25 : 400;
		this.highScoresEntryPane.position.set(entryPaneX, entryPaneY);
		this.highScoresEntryPane.setInputOffsets(entryPaneX, entryPaneY);
		this.positionScoresPane();
	}

	displayChange(dVars:DisplayVars) {
		this.orient = dVars.orient;
		this.setupDisplay(dVars);
		this.highScoresTable.setupDisplay(dVars, this.dSettings);
		this.highScoresTableLines.setupDisplay(dVars, this.dSettings);
		this.highScoresArrows.setupDisplay(dVars, this.dSettings);
		this.highScoresScoresPane.setupDisplay(dVars, this.dSettings);
		this.highScoresEntryPane.displayChange(dVars, this.dSettings);
	}

	updateInputs(dVars:DisplayVars) {
		this.highScoresEntryPane.updateInputs(dVars);
	}

	positionScoresPane() {
		if (this.orient === 0) {
			this.highScoresScoresPane.x = 68;
			this.highScoresScoresPane.y = this.highScoresTable.y;
			if (this.highScoresEntryPane.visible) this.highScoresScoresPane.y -= 105;
		} else {
			this.highScoresScoresPane.x = this.highScoresEntryPane.visible ? 163 : 275;
			// this.highScoresScoresPane.y = 650;
			this.highScoresScoresPane.y = 507;
		}
	}

	setContentTitle(title:string) { this.highScoresTable.setContentTitle(title); }

	setPlayerPosition(ind:number, pos:number) {	this.playerPositions[ind] = pos; }

	getPlayerPosition(ind:number) { return this.playerPositions[ind]; }

	setScoresPane(label:string, score:number) {
		this.highScoresScoresPane.setScores(label, score);
	}

	gettingScores() {
		this.scoresReceived = false;
		this.submitSent = false;
	}

	setDisplaySeq(displaySeq:number[]) {
		this.displaySeq = displaySeq;
	}

	gotScores() {
		this.scoresReceived = true;
		this.displayInd = this.displaySeq.length - 1;
		if (this.submitSent) {
			this.resetCounter();
			if (this.active) this.showScores(0);
		} else {
			this.showEntryPaneFlag = true;
			this.incDisplayInd = false;
		}
	}

	updateSeq(add:number) {
		this.storeYOff();
		let tmp = -1;
		if (this.incDisplayInd) {
			tmp = this.displayInd;
			this.displayInd += add;
		}
		this.incDisplayInd = true;
		if (this.displayInd < 0) this.displayInd = this.displaySeq.length - 1;
		if (this.displayInd === this.displaySeq.length) this.displayInd = 0;
		if (this.displayInd !== tmp) this.showScores(add);
	}

	showScores(dir:number) {
		let curSet = this.displaySeq[this.displayInd];
		this.highScoresTableLines.showScores(this.scores[curSet], dir, curSet);
		let pPos = this.playerPositions[this.displaySeq[this.displayInd]];
		if (pPos !== -1) { //always return y position to place where player score shows
			this.highScoresTableLines.showPlayerHighlight(pPos);
		} else {
			this.highScoresTableLines.showLastYPosition(this.yOffs[this.displayInd]);
		}
		this.highScoresTable.updateTitle(curSet);
		if (this.displaySeq.length !== 1) {
			this.highScoresSeqArrows.visible = true;
		} else {
			this.highScoresSeqArrows.visible = false;
		}
		if (this.showEntryPaneFlag) this.showEntryPane();
	}

	showEntryPane() {
		this.showEntryPaneFlag = false;
		//got scores for first time, so can have entrypane display input stuff
		this.highScoresEntryPane.show();
		this.positionScoresPane();
		this.fadeInEntry.restart(true, false);
		this.fadeInScores.restart(true, false);
	}

	submitClick(nom:string, loc:string) {
		this.submitSent = true;
		this.positionScoresPane();
		this.fadeInScores.restart(true, false);
		this.emit('submitclick', nom, loc);
	}

	isSubmitSent() {
		return this.submitSent;
	}

	storeYOff() {
		this.yOffs[this.displayInd] = this.highScoresTableLines.getFieldsY();
	}

	scrollUp() {
		this.highScoresTableLines.scrollUp();
		this.timerCount = this.SEQ_LOW;
	}

	scrollDown() {
		this.highScoresTableLines.scrollDown();
		this.timerCount = this.SEQ_LOW;
	}

	seqNext() {
		this.updateSeq(1);
		this.stopTimer();
	}

	seqPrev() {
		this.updateSeq(-1);
		this.stopTimer();
	}

	stopTimer() {
		if (this.myTimer !== null) {
			clearTimeout(this.myTimer);
			this.myTimer = null;
		}
	}

	myCounter() {
		this.timerCount += 1;
		if (this.timerCount >= this.SEQ_LIM && this.scoresReceived) {
			this.timerCount = 0;
			this.updateSeq(1);
		}
		this.myTimer = window.setTimeout(this.myCounter, 200);
	}

	resetCounter() {
		this.timerCount = 0;
	}

	start() {
		this.active = true;
		this.incDisplayInd = true;
		this.yOffs = [0, 0, 0];
		this.submitSent = false;

		if (!this.scoresReceived) {
			this.displaySeq = [0];//offline
			this.displayInd = 0;
		}

		this.highScoresArrows.addLists();
		this.highScoresSeqArrows.addLists();
		this.highScoresArrows.on('scrollup', this.scrollUp);
		this.highScoresArrows.on('scrolldown', this.scrollDown);
		this.highScoresSeqArrows.on('seqnext', this.seqNext);
		this.highScoresSeqArrows.on('seqprev', this.seqPrev);

		this.highScoresEntryPane.start();
		this.highScoresEntryPane.on('submitclick', this.submitClick);

		this.timerCount = this.SEQ_START;
		this.highScoresEntryPane.hide();//this.showScores(0) will typically show this

		this.positionScoresPane();
		this.showScores(0);
		this.myCounter();
	}

	stop() {
		this.active = false;
		this.showEntryPaneFlag = false;
		this.highScoresArrows.removeLists();
		this.highScoresSeqArrows.removeLists();
		this.highScoresArrows.off('scrollup');
		this.highScoresArrows.off('scrolldown');
		this.highScoresSeqArrows.off('seqnext');
		this.highScoresSeqArrows.off('seqprev');
		this.highScoresTableLines.reset();
		this.highScoresEntryPane.stop();
		this.highScoresEntryPane.hide();
		this.highScoresEntryPane.off('submitclick');
		this.stopTimer();
	}
}

class HighScoresArrows extends PIXI.Container {
	private INTERVAL_TIME = 20;
	private myUpBut:PIXI.Container;
	private myDownBut:PIXI.Container;
	private upRect:PIXI.Graphics;
	private downRect:PIXI.Graphics;
	private myInterval:number|null=null;
	private delta:number=0;

	constructor(dVars:DisplayVars, displaySettings:HSDisplaySettings) {
		super();

		this.stopUp = this.stopUp.bind(this);
		this.stopDown = this.stopDown.bind(this);
		this.startUp = this.startUp.bind(this);
		this.startDown = this.startDown.bind(this);
		this.scrollUp = this.scrollUp.bind(this);
		this.scrollDown = this.scrollDown.bind(this);

		this.myUpBut = new PIXI.Container();
		this.myDownBut = new PIXI.Container();

		let myUpArrow = new PIXI.Graphics();
		let myDownArrow = new PIXI.Graphics();
		makeArrow(myUpArrow, 32, displaySettings.arrowStroke, displaySettings.arrowColor);
		makeArrow(myDownArrow, 32, displaySettings.arrowStroke, displaySettings.arrowColor);
		myUpArrow.rotation = -1.57;
		myDownArrow.rotation = 1.57;

		this.upRect = new PIXI.Graphics();
		this.downRect = new PIXI.Graphics();
		makeRect(this.upRect, 120, 80, 0, 0xffffff, 0xffffff);
		makeRect(this.downRect, 120, 80, 0, 0xffffff, 0xffffff);
		this.upRect.alpha = 0.01;
		this.downRect.alpha = 0.01;

		this.myUpBut.addChild(myUpArrow, this.upRect);
		this.myDownBut.addChild(myDownArrow, this.downRect);

		this.addChild(this.myUpBut, this.myDownBut);
		this.setupDisplay(dVars, displaySettings);
	}

	setupDisplay(dVars:DisplayVars, displaySettings:HSDisplaySettings) {
		let yAdj = dVars.orient === 0 ? displaySettings.adjustYs[0] : displaySettings.adjustYs[1];
		if (dVars.orient === 0) {
			this.myUpBut.position.set(735, 180 + yAdj);
			this.myDownBut.position.set(735, 290 + yAdj);
			this.upRect.visible = false;
			this.downRect.visible = false;
		} else {
			// this.myUpBut.position.set(275, 30 + yAdj);
			// this.myDownBut.position.set(275, 578 + yAdj);
			this.myUpBut.position.set(220, 35 + yAdj);
			this.myDownBut.position.set(330, 60 + yAdj);
			this.upRect.visible = true;
			this.downRect.visible = true;
		}
	}

	startUp() {
		this.delta = 0;
		this.removeInterval();
		this.myInterval = window.setInterval(this.scrollUp, this.INTERVAL_TIME);
		this.myUpBut.on('mouseout', this.stopUp);
	}

	stopUp() {
		this.removeInterval();
		if (this.delta === 0) this.scrollUp();
		this.delta = 0;
	}

	removeInterval() {
		if (this.myInterval !== null) {
			clearInterval(this.myInterval);
			this.myInterval = null;
		}
		this.myUpBut.off('mouseout');
		this.myDownBut.off('mouseout');
	}

	startDown() {
		this.delta = 0;
		this.removeInterval();
		this.myInterval = window.setInterval(this.scrollDown, this.INTERVAL_TIME);
		this.myDownBut.on('mouseout', this.stopDown);
	}

	stopDown() {
		this.removeInterval();
		if (this.delta === 0) this.scrollDown();
		this.delta = 0;
	}

	scrollUp() {
		this.delta += 1;
		this.emit('scrollup');
	}

	scrollDown() {
		this.delta += 1;
		this.emit('scrolldown');
	}

	addLists() {
		this.myUpBut.on('pointerdown', this.startUp);
		this.myDownBut.on('pointerdown', this.startDown);
		this.myUpBut.on('pointerup', this.stopUp);
		this.myDownBut.on('pointerup', this.stopDown);
		this.myUpBut.buttonMode = true;
		this.myDownBut.buttonMode = true;
		this.myUpBut.interactive = true;
		this.myDownBut.interactive = true;
	}

	removeLists() {
		this.myUpBut.off('pointerdown');
		this.myDownBut.off('pointerdown');
		this.myUpBut.off('pointerup');
		this.myUpBut.off('pointerup');
		this.myUpBut.buttonMode = false;
		this.myDownBut.buttonMode = false;
		this.myUpBut.interactive = false;
		this.myDownBut.interactive = false;
		this.removeInterval();
	}
}

class HighScoresEntryInputs extends PIXI.Container {
	private SWEARS_LIST = ['fuck', 'shit', 'dick', 'suck', 'cock', 'twat', 'gun', 'shoot', 'kill',
		'fock', 'bitch', 'penis', 'arse', 'nigger', 'vagina', 'cunt'];
	private CANVAS_ID = 'myCanvas';//this is defined in display.js
	private BORDER_STYLES=['1px solid #bbbbbb', '1px solid #ffdd00'];
	private myScale:number;
	private entryMaxLength:number;
	private offsetX:number = 0;
	private offsetY:number = 0;
	private fieldTween1:GSAPTween|null=null;
	private fieldTween2:GSAPTween|null=null;
	private nDiv:HTMLInputElement;
	private lDiv:HTMLInputElement;

	private nameElemX:number = 0;
	private nameElemY:number = -22;
	private localElemX:number = 0;
	private localElemY:number = 45;
	private fieldWidth:number = 84;
	private fieldHeight:number = 18;
	private fontSizes:number[] =[];

	constructor(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		super();
		this.myScale = dVars.scale;
		this.visible = false;
		this.entryMaxLength = dStngs.entryMaxLength;

		this.cleanInputs = this.cleanInputs.bind(this);

		this.nDiv = document.createElement('input');
		this.nDiv.id = 'inputName';
		this.setInputStyle(this.nDiv, dStngs.fonts[2], dStngs.fontColors[5]);
		document.getElementById('containerDiv')?.appendChild(this.nDiv);
		this.lDiv = document.createElement('input');
		this.lDiv.id = 'inputLocal';
		this.setInputStyle(this.lDiv, dStngs.fonts[2], dStngs.fontColors[5]);
		document.getElementById('containerDiv')?.appendChild(this.lDiv);

		this.setupDisplay(dVars, dStngs);
	}

	setupDisplay(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		if (dVars.orient === 0) {
			this.nameElemX = 0;
			this.nameElemY = -22;
			this.localElemX = 0;
			this.localElemY = 45;
			this.fieldWidth = 84;
			this.fieldHeight = 18;
			this.fontSizes = dStngs.fontSizes;
		} else {
			this.nameElemX = -1;
			this.nameElemY = -130;
			this.localElemX = -1;
			this.localElemY = -15;
			this.fieldWidth = 230;
			this.fieldHeight = 44;
			this.fontSizes = dStngs.fontSizesPort;
		}
	}

	displayChange(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		this.setupDisplay(dVars, dStngs);
	}

	updateInputs(dVars:DisplayVars) {
		this.myScale = dVars.scale;
		if (this.visible) this.updateInputElements();
	}

	setInputOffsets(entryPaneX:number, entryPaneY:number) {
		this.offsetX = entryPaneX;
		this.offsetY = entryPaneY;
	}

	updateInputElements() {
		let wid = Math.round(this.fieldWidth * this.myScale);
		let hei = Math.round(this.fieldHeight * this.myScale);

		let newFontSize = Math.round(this.fontSizes[4] * this.myScale);
		newFontSize = Math.floor(newFontSize);
		this.nDiv.style.fontSize = newFontSize + 'px';
		this.lDiv.style.fontSize = newFontSize + 'px';
		this.nDiv.style.height = hei + 'px';
		this.lDiv.style.height = hei + 'px';
		this.nDiv.style.width = wid + 'px';
		this.lDiv.style.width = wid + 'px';

		let newPadding = Math.round(4 * this.myScale);
		this.nDiv.style.padding = newPadding + 'px 0px';
		this.lDiv.style.padding = newPadding + 'px 0px';

		let myCan = document.getElementById(this.CANVAS_ID);
		let myX = myCan?myCan.offsetLeft:0;
		let myY = myCan?myCan.offsetTop:0;

		let xPosName = Math.round(myX + (this.offsetX + this.nameElemX) * this.myScale - wid / 2);
		let yPosName = Math.round(myY + (this.offsetY + this.nameElemY) * this.myScale - hei / 2);
		let xPosLocal = Math.round(myX + (this.offsetX + this.localElemX) * this.myScale - wid / 2);
		let yPosLocal = Math.round(myY + (this.offsetY + this.localElemY) * this.myScale - hei / 2);

		this.nDiv.style.left = xPosName + 'px';
		this.nDiv.style.top = yPosName + 'px';
		this.lDiv.style.left = xPosLocal + 'px';
		this.lDiv.style.top = yPosLocal + 'px';
	}

	showFields(fadeIn:boolean) {
		this.visible = true;
		this.updateInputElements();
		let myInput=document.querySelector('input');
		if(myInput)myInput.autofocus = true;
		this.nDiv.style.display = 'block';
		this.lDiv.style.display = 'block';
		if (fadeIn) {
			this.lDiv.style.opacity = '0';
			this.nDiv.style.opacity = '0';
			this.fieldTween1 = gsap.to(this.lDiv, { delay: 0.3, duration: 0.4, opacity: 1 });
			this.fieldTween2 = gsap.to(this.nDiv, { delay: 0.3, duration: 0.4, opacity: 1 });
		}
	}

	hideFields() {
		this.visible = false;
		this.nDiv.style.display = 'none';
		this.lDiv.style.display = 'none';
	}

	cleanInputs() {
		let max = this.entryMaxLength;
		let nom = this.nDiv.value;
		if (nom.length > max)nom = nom.slice(0, max);
		nom = nom.replace(/[^a-zA-Z ]/g, '');
		this.nDiv.value = nom;
		let loc = this.lDiv.value;
		if (loc.length > max)loc = loc.slice(0, max);
		loc = loc.replace(/[^a-zA-Z ]/g, '');
		this.lDiv.value = loc;
		if (nom.length > 0) this.nDiv.style.border = this.BORDER_STYLES[0];
		if (loc.length > 0) this.lDiv.style.border = this.BORDER_STYLES[0];
	}

	getInputs() {
		this.cleanInputs();
		let nom = this.nDiv.value;
		let loc = this.lDiv.value;
		nom = this.checkText(nom);
		loc = this.checkText(loc);
		this.nDiv.value = nom;
		this.lDiv.value = loc;
		if (loc.length === 0) this.lDiv.style.border = this.BORDER_STYLES[1];
		if (nom.length === 0) this.nDiv.style.border = this.BORDER_STYLES[1];
		return { nom, loc };
	}

	setInputStyle(div:HTMLInputElement, fnt:string, fntCol:number) {
		div.setAttribute('type', 'text');
		div.setAttribute('maxlength', this.entryMaxLength.toString());
		div.style.position = 'absolute';
		div.style.left = '0';
		div.style.top = '0';
		div.style.display = 'none';
		div.style.textAlign = 'center';
		div.style.fontFamily = fnt;
		div.style.color = fntCol.toString();
		div.style.textDecoration = 'none';
		div.style.border = this.BORDER_STYLES[0];
		div.style.borderRadius = '0.5em';
		div.style.outline = 'none';
		div.style.margin = '0px';
		div.style.padding = '4px 0px';
		div.style.zIndex = '4';
	}

	checkText(leText:string) {
		let outText = leText.slice(0, this.entryMaxLength);
		outText = outText.replace(/[^a-z]/gi, '');
		outText = outText.toLowerCase();
		for (let i = 0; i < this.SWEARS_LIST.length; i++) {
			let re = new RegExp(this.SWEARS_LIST[i], 'g');
			outText = outText.replace(re, '');
		}
		outText = outText.charAt(0).toUpperCase() + outText.slice(1);
		return outText;
	}

	addLists() {
		document.addEventListener('keyup', this.cleanInputs);
	}

	removeLists() {
		document.removeEventListener('keyup', this.cleanInputs);
	}
}


class HighScoresEntryPane extends PIXI.Container {
	private back:PIXI.Graphics;
	private backShade:PIXI.Graphics;
	private cancelBut:PIXI.Container;
	private cancelButBack:PIXI.Graphics;
	private submitBut:PIXI.Container;
	private submitButBack:PIXI.Graphics;
	private enterBut:PIXI.Container;
	private enterButBack:PIXI.Graphics;
	private inputFields:HighScoresEntryInputs;
	private enterText:PIXI.Text;
	private nameLabel:PIXI.Text;
	private localLabel:PIXI.Text;
	private submitText:PIXI.Text;
	private cancelText:PIXI.Text;
	private orient:number=0;

	constructor(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		super();
		this.visible = false;

		this.submitClick = this.submitClick.bind(this);
		this.enterClick = this.enterClick.bind(this);
		this.cancelClick = this.cancelClick.bind(this);

		this.back = new PIXI.Graphics();
		this.back.alpha = dStngs.scoresPaneAlpha;
		this.backShade = new PIXI.Graphics();
		this.submitBut = new PIXI.Container();
		this.submitButBack = new PIXI.Graphics();
		this.cancelBut = new PIXI.Container();
		this.cancelButBack = new PIXI.Graphics();
		this.enterBut = new PIXI.Container();
		this.enterButBack = new PIXI.Graphics();
		this.inputFields = new HighScoresEntryInputs(dVars, dStngs);

		this.enterText = new PIXI.Text('Enter', { fontFamily: dStngs.fonts[2], fill: dStngs.fontColors[4], fontWeight: 'bold' });
		this.enterText.anchor.set(0.5);
		this.enterBut.cursor = 'pointer';
		this.enterBut.addChild(this.enterButBack, this.enterText);

		this.nameLabel = new PIXI.Text('Name', { fontFamily: dStngs.fonts[2], fill: dStngs.fontColors[3], fontWeight: 'bold' });
		this.localLabel = new PIXI.Text('Location', { fontFamily: dStngs.fonts[2], fill: dStngs.fontColors[3], fontWeight: 'bold' });
		this.submitText = new PIXI.Text('Enter', { fontFamily: dStngs.fonts[2], fill: dStngs.fontColors[4], fontWeight: 'bold' });
		this.cancelText = new PIXI.Text('Cancel', { fontFamily: dStngs.fonts[2], fill: dStngs.fontColors[4], fontWeight: 'bold' });

		this.submitText.anchor.set(0.5);
		this.cancelText.anchor.set(0.5);
		this.nameLabel.anchor.set(0.5);
		this.localLabel.anchor.set(0.5);

		this.submitBut.cursor = 'pointer';
		this.submitBut.addChild(this.submitButBack, this.submitText);
		this.cancelBut.cursor = 'pointer';
		this.cancelBut.addChild(this.cancelButBack, this.cancelText);

		this.addChild(this.enterBut, this.backShade, this.back, this.submitBut, this.cancelBut);
		this.addChild(this.nameLabel, this.localLabel, this.inputFields);

		this.setupDisplay(dVars, dStngs);
	}

	setupDisplay(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		this.orient = dVars.orient;
		if (dVars.orient === 0) {
			this.submitBut.position.set(0, 110);
			this.nameLabel.position.set(0, -48);
			this.localLabel.position.set(0, 18);
		} else {
			this.submitBut.position.set(-0, 85);
			this.nameLabel.position.set(-0, -180);
			this.localLabel.position.set(0, -65);
			this.cancelBut.position.set(0, 165);
			this.enterBut.position.set(115, 107);
		}
		this.setupBack(dVars, dStngs);
		this.setupButs(dVars, dStngs);
		this.setupFonts(dVars, dStngs);
	}

	displayChange(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		this.setupDisplay(dVars, dStngs);
		this.inputFields.displayChange(dVars, dStngs);
		if (this.visible) this.show();
	}

	updateInputs(dVars:DisplayVars) {
		this.inputFields.updateInputs(dVars);
	}

	setInputOffsets(entryPaneX:number, entryPaneY:number) {
		this.inputFields.setInputOffsets(entryPaneX, entryPaneY);
	}

	setupBack(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		let w = dVars.orient === 0 ? 116 : 340;
		let h = dVars.orient === 0 ? 160 : 470;
		let r = dVars.orient === 0 ? 22 : 36;
		this.back.clear();
		if (dStngs.scoresPaneMargin > 0) {
			this.back.beginFill(dStngs.backPaneColors[1]);
			this.back.lineStyle(1, dStngs.backPaneColors[0]);
			this.back.drawRoundedRect(-w / 2, -h / 2, w, h, r);
			w -= dStngs.scoresPaneMargin;
			h -= dStngs.scoresPaneMargin;
			r -= Math.floor(dStngs.scoresPaneMargin / 3);
		}
		this.back.lineStyle(1, dStngs.backPaneColors[2]);
		this.back.beginFill(dStngs.backPaneColors[3]);
		this.back.drawRoundedRect(-w / 2, -h / 2, w, h, r);
	}

	setupButs(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		let w = dVars.orient === 0 ? 112 : 260;
		let h = dVars.orient === 0 ? 44 : 72;
		let r = dVars.orient === 0 ? 16 : 20;
		this.submitButBack.clear();
		this.submitButBack.beginFill(0xffff88);
		if (dStngs.submitBorder > 0) this.submitButBack.lineStyle(1, 0xaaaaaa);
		this.submitButBack.drawRoundedRect(-w / 2, -h / 2, w, h, r);
		this.cancelButBack.clear();
		this.cancelButBack.beginFill(0xcccccc);
		this.cancelButBack.drawRoundedRect(-w / 2, -h / 2, w, h, r);
		w = 210;
		h = 75;
		this.enterButBack.clear();
		this.enterButBack.beginFill(0xffff88);
		if (dStngs.submitBorder > 0) this.enterButBack.lineStyle(1, 0xaaaaaa);
		this.enterButBack.drawRoundedRect(-w / 2, -h / 2, w, h, r);
		w = dStngs.entryShadeWidth;
		this.backShade.clear();
		this.backShade.beginFill(0x000000);
		this.backShade.drawRect(-w / 2, -400, w, 800);
		this.backShade.alpha = 0.6;
	}

	setupFonts(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		let fontSizes = dVars.orient === 0 ? dStngs.fontSizes : dStngs.fontSizesPort;
		this.enterText.style.fontSize = fontSizes[4];
		this.nameLabel.style.fontSize = fontSizes[3];
		this.localLabel.style.fontSize = fontSizes[3];
		this.submitText.style.fontSize = fontSizes[4];
		this.cancelText.style.fontSize = fontSizes[4];
		this.enterText.resolution = dVars.textResolution;
		this.nameLabel.resolution = dVars.textResolution;
		this.localLabel.resolution = dVars.textResolution;
		this.submitText.resolution = dVars.textResolution;
		this.cancelText.resolution = dVars.textResolution;
	}

	submitClick() {
		let inputs = this.inputFields.getInputs();
		if (inputs.nom.length > 0 && inputs.loc.length > 0) {
			this.hide();//this is important to prevent double clicks
			this.emit('submitclick', inputs.nom, inputs.loc);
		}
	}

	cancelClick() {
		this.toggleEntryPane(false);
	}

	enterClick() {
		this.toggleEntryPane(true);
	}

	show() {
		this.visible = true;
		if (this.orient === 0) {
			this.showLand();
		} else {
			this.showPort();
		}
		//stuff here
		//remember, this is typically called b4 init
	}

	hide() {
		this.visible = false;
		this.inputFields.hideFields();
	}

	showLand() {
		this.back.visible = true;
		this.submitBut.visible = true;
		this.nameLabel.visible = true;
		this.localLabel.visible = true;
		this.backShade.visible = false;
		this.enterBut.visible = false;
		this.cancelBut.visible = false;
		this.inputFields.showFields(true);
	}

	showPort() {
		this.enterBut.visible = true;
		this.back.visible = false;
		this.nameLabel.visible = false;
		this.localLabel.visible = false;
		this.submitBut.visible = false;
		this.cancelBut.visible = false;
		this.backShade.visible = false;
		this.inputFields.hideFields();
	}

	toggleEntryPane(showBool:boolean) {
		let myBool = showBool;
		this.back.visible = myBool;
		this.cancelBut.visible = myBool;
		this.submitBut.visible = myBool;
		this.nameLabel.visible = myBool;
		this.localLabel.visible = myBool;
		this.backShade.visible = myBool;
		if (showBool) {
			this.inputFields.showFields(false);
		} else {
			this.inputFields.hideFields();
		}
	}

	start() {
		this.submitBut.on('pointertap', this.submitClick);
		this.cancelBut.on('pointertap', this.cancelClick);
		this.enterBut.on('pointertap', this.enterClick);
		this.backShade.on('pointertap', this.cancelClick);

		this.submitBut.interactive = true;
		this.cancelBut.interactive = true;
		this.enterBut.interactive = true;
		this.submitBut.buttonMode = true;

		this.inputFields.addLists();
	}

	stop() {
		this.submitBut.off('pointertap');
		this.cancelBut.off('pointertap');
		this.enterBut.off('pointertap');
		this.backShade.off('pointertap');

		this.submitBut.interactive = false;
		this.cancelBut.interactive = false;
		this.enterBut.interactive = false;
		this.submitBut.buttonMode = false;

		this.inputFields.removeLists();
	}
}


class HighScoresLoader extends PIXI.utils.EventEmitter {
	private settings:HSSettings;
	private myReq:XMLHttpRequest|null=null;
	constructor(settings:HSSettings) {
		super();
		this.settings = settings;
		this.gotScores = this.gotScores.bind(this);
	}

	getScores(sendPlayerData:boolean, gameData:GameData) {
		if (this.myReq !== null) {
			this.myReq.removeEventListener('readystatechange', this.gotScores);
			this.myReq = null;
		}
		this.myReq = new XMLHttpRequest();
		this.myReq.addEventListener('readystatechange', this.gotScores);
		this.myReq.open('POST', this.settings.URL, true);
		this.myReq.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		let mylets = this.makePostlets(sendPlayerData, gameData);
		this.myReq.send(mylets);
	}

	gotScores() {
		if (this.myReq?.readyState === 4 && this.myReq.status === 200) {
			try {
				let parsed = JSON.parse(this.myReq.responseText);
				this.emit('gotscores', parsed);
			} catch (e) {
				console.log('error - could not parse response ', e);
			}
			this.myReq.removeEventListener('readystatechange', this.gotScores);
			this.myReq = null;
		}
	}

	makePostlets(sendPlayerData:boolean, gameData:GameData) {
		let sendContent=gameData.contentCode !== null?gameData.contentCode:undefined;

		let sendScoreLine={};
		if (sendPlayerData) {
			sendScoreLine={
				nom : gameData.playerName,
				local : gameData.playerLocation,
				score : gameData.score,
				time : gameData.time,
				moves : gameData.moves,
				content : sendContent
			}
		}

		let sendOb = {
			meta:{
				reqType : 'scores',
				srcType :	'online',
				insert : sendPlayerData,
				table : this.settings.SCORES_TABLE,
				gameType : this.settings.TABLE_TYPE,
				content : sendContent
			},
			scoreLine : sendScoreLine
		};
		return JSON.stringify(sendOb);
	}
}


class HighScoresScoresPane extends PIXI.Container {
	private back:PIXI.Graphics;
	private scoreDisp:PIXI.Text;
	private scoreLabel:PIXI.Text;
	constructor(dVars:DisplayVars, dSettings:HSDisplaySettings) {
		super();
		this.back = new PIXI.Graphics();
		this.back.alpha = dSettings.scoresPaneAlpha;
		this.scoreDisp = new PIXI.Text('0', {
			fontFamily: dSettings.fonts[2],
			fill: dSettings.fontColors[3],
			fontWeight: 'bold'
		});

		this.scoreLabel = new PIXI.Text('label', {
			fontFamily: dSettings.fonts[2],
			fill: dSettings.fontColors[3],
			fontWeight: 'bold'
		});

		this.scoreLabel.anchor.set(0.5);
		this.scoreDisp.anchor.set(0.5);
		this.addChild(this.back, this.scoreLabel, this.scoreDisp);
		this.setupDisplay(dVars, dSettings);
	}

	setupDisplay(dVars:DisplayVars, dSettings:HSDisplaySettings) {
		this.back.clear();
		let backWidth = 116;
		let backHeight = 80;
		if (dVars.orient === 0) {
			this.scoreLabel.position.set(0, -10);
			this.scoreDisp.position.set(0, 15);
			this.scoreLabel.style.fontSize = dSettings.fontSizes[3];
			this.scoreDisp.style.fontSize = dSettings.fontSizes[3];
		} else {
			backWidth = 210;
			this.scoreLabel.position.set(-40, 0);
			this.scoreDisp.position.set(44, 0);
			this.scoreLabel.style.fontSize = dSettings.fontSizesPort[3];
			this.scoreDisp.style.fontSize = dSettings.fontSizesPort[3];
		}

		let w = backWidth;
		let h = backHeight;
		let r = 20;
		if (dSettings.scoresPaneMargin > 0) {
			this.back.lineStyle(1, dSettings.backPaneColors[0]);
			this.back.beginFill(dSettings.backPaneColors[1]);
			this.back.drawRoundedRect(-w / 2, -h / 2, w, h, r);
			w -= dSettings.scoresPaneMargin;
			h -= dSettings.scoresPaneMargin;
			r -= Math.floor(dSettings.scoresPaneMargin / 3);
		}
		this.back.beginFill(dSettings.backPaneColors[3]);
		this.back.lineStyle(1, dSettings.backPaneColors[2]);
		this.back.drawRoundedRect(-w / 2, -h / 2, w, h, r);

		this.scoreLabel.resolution = dVars.textResolution;
		this.scoreDisp.resolution = dVars.textResolution;
	}

	setScores(label:string, score:number) {
		this.scoreLabel.text = capitalizeFirst(label);
		this.scoreDisp.text = score.toString();
	}
}


class HighScoresSeqArrows extends PIXI.Container {
	private rArrow:PIXI.Container;
	private lArrow:PIXI.Container;
	constructor(dSettings:HSDisplaySettings) {
		super();

		this.carouselClick = this.carouselClick.bind(this);

		this.rArrow = new PIXI.Container();
		this.lArrow = new PIXI.Container();

		let rRect = new PIXI.Graphics();
		let lRect = new PIXI.Graphics();
		makeRect(rRect, 120, 80, 0, 0xffffff, 0xffffff);
		makeRect(lRect, 120, 80, 0, 0xffffff, 0xffffff);
		rRect.alpha = 0.01;
		lRect.alpha = 0.01;

		this.rArrow.addChild(rRect);
		this.lArrow.addChild(lRect);

		let rArr = this.drawArrow(12, dSettings.arrowColor);
		let lArr = this.drawArrow(12, dSettings.arrowColor);
		lArr.rotation = Math.PI;

		this.rArrow.addChild(rArr);
		this.lArrow.addChild(lArr);

		this.rArrow.x = dSettings.seqArrowsWidth / 2;
		this.lArrow.x = -dSettings.seqArrowsWidth / 2;

		this.addChild(this.rArrow, this.lArrow);
	}

	hideArrows() {
		this.rArrow.visible = false;
		this.lArrow.visible = false;
	}

	showArrows() {
		this.rArrow.visible = true;
		this.lArrow.visible = true;
	}

	carouselClick(e:PIXI.InteractionEvent) {
		if (e.currentTarget === this.rArrow) {
			this.emit('seqnext');
		} else {
			this.emit('seqprev');
		}
	}

	addLists() {
		this.rArrow.on('pointertap', this.carouselClick);
		this.lArrow.on('pointertap', this.carouselClick);
		this.rArrow.buttonMode = true;
		this.lArrow.buttonMode = true;
		this.rArrow.interactive = true;
		this.lArrow.interactive = true;
	}

	removeLists() {
		this.rArrow.off('pointertap');
		this.lArrow.off('pointertap');
		this.rArrow.buttonMode = false;
		this.lArrow.buttonMode = false;
		this.rArrow.interactive = false;
		this.lArrow.interactive = false;
	}

	drawArrow(size:number, color:number) {
		let outShape = new PIXI.Graphics();
		outShape.beginFill(color);
		outShape.lineStyle(1, 0x999999);
		outShape.arc(0, 0, size * 0.56, -1, 1);
		outShape.arc(-size, size, size * 0.40, 1, Math.PI);
		outShape.arc(-size, -size, size * 0.40, Math.PI, -1);
		outShape.closePath();
		return outShape;
	}
}


class HighScoresTable extends PIXI.Container {

	private TITLE_TEXTS = ['Offline', 'All', '30 days', '7 days', '24 hours'];
	// private PANE_WID = 522;
	private PANE_WID = 536;
	// const this.PANE_HEI = 440;
	private PANE_HEI = 364;
	private PANE_RND = 48;
	private TITLE_Y = -140;
	private TITLES_X = -226;//this should match with FIELDS_X in HighScoresTableLines
	private TITLES_Y = -91;

	private contentTitle:string='';
	private titlesContainer:PIXI.Container;
	private backPane:PIXI.Graphics;
	private titleText:PIXI.Text;
	private numColumns:number;
	private titles:PIXI.Text[]=[];

	constructor(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		super();
		this.titlesContainer = new PIXI.Container();
		this.backPane = new PIXI.Graphics();
		this.drawBackPane(dStngs);
		this.titleText = new PIXI.Text('title', { fontFamily: dStngs.fonts[0], fill: dStngs.fontColors[0], fontWeight: 'bold' });
		this.titleText.anchor.set(0.5);
		this.numColumns = dStngs.titleLabels.length;
		for (let i = 0; i < this.numColumns; i++) {
			this.titles[i] = new PIXI.Text(dStngs.titleLabels[i],
				{ fontFamily: dStngs.fonts[1], fill: dStngs.fontColors[1], align: 'center', fontWeight: 'bold' });
			this.titlesContainer.addChild(this.titles[i]);
			this.titles[i].x = dStngs.xPositions[i];
			this.titles[i].anchor.set(0.5);
		}
		this.titleText.position.set(0, this.TITLE_Y);
		this.titlesContainer.position.set(this.TITLES_X, this.TITLES_Y);

		this.addChild(this.backPane, this.titleText, this.titlesContainer);
		this.setupDisplay(dVars, dStngs);
	}

	setupDisplay(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		this.updateFontSizes(dVars, dStngs);
		this.titleText.resolution = dVars.textResolution;
		for (let i = 0; i < this.numColumns; i++) {
			this.titles[i].resolution = dVars.textResolution;
		}
	}

	setContentTitle(title:string) { this.contentTitle = title; }

	drawBackPane(dStngs:HSDisplaySettings) {
		let w = this.PANE_WID;
		let h = this.PANE_HEI;
		let r = this.PANE_RND;
		if (dStngs.backPaneMargin > 0) {
			this.backPane.clear();
			this.backPane.lineStyle(1, dStngs.backPaneColors[0]);
			this.backPane.beginFill(dStngs.backPaneColors[1]);
			this.backPane.drawRoundedRect(-w / 2, -h / 2, w, h, r);
			w -= dStngs.backPaneMargin;
			h -= dStngs.backPaneMargin;
			r -= Math.floor(dStngs.backPaneMargin / 3);
		}
		this.backPane.lineStyle(1, dStngs.backPaneColors[2]);
		this.backPane.beginFill(dStngs.backPaneColors[3]);
		this.backPane.drawRoundedRect(-w / 2, -h / 2, w, h, r);
		this.backPane.alpha = dStngs.backPaneAlpha;
	}

	updateFontSizes(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		let fontSizes = dVars.orient === 0 ? dStngs.fontSizes : dStngs.fontSizesPort;
		this.titleText.style.fontSize = fontSizes[0];
		for (let i = 0; i < this.numColumns; i++) {
			this.titles[i].style.fontSize = fontSizes[1];
		}
	}

	updateTitle(curSet:number) {
		let curText = this.TITLE_TEXTS[curSet];
		if (this.contentTitle !== '' && curSet !== 0) {
			this.titleText.text = this.contentTitle + ' - ' + curText;
		} else {
			this.titleText.text = curText;
		}
		// this.titleTween.restart(true, false);
		// this.titlesTween.restart(true, false);
	}
}


class HighScoresTableLines extends PIXI.Container {

	private	MONTH_TEXTS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	private LINE_HEI = 38;
	private PANE_WID = 496;
	private PANE_RND = 8;
	private NUM_ROWS = 6;
	private FIELDS_X = -226;

	private lineType:string;
	private playerHighlight:PIXI.Graphics;
	private fieldsMask:PIXI.Graphics;
	private fieldsContainer:PIXI.Container;
	private linesTween:GSAPTween|null=null;
	private columns:number;
	private tFields:PIXI.Text[];
	private tFieldsText:string[];
	private baseY:number=0;
	private minY:number=0;
	private rowsCount:number=0;

	constructor(dVars:DisplayVars, settings:HSSettings, dStngs:HSDisplaySettings) {
		super();
		this.lineType=settings.TABLE_TYPE;

		this.playerHighlight = new PIXI.Graphics();

		this.playerHighlight.lineStyle(1, dStngs.highlightColors[0]);
		this.playerHighlight.beginFill(dStngs.highlightColors[1]);
		this.playerHighlight.drawRoundedRect(-20, -6, this.PANE_WID, this.LINE_HEI - 3, this.PANE_RND);
		this.playerHighlight.alpha = dStngs.highlightAlpha;
		this.playerHighlight.visible = false;

		this.fieldsContainer = new PIXI.Container();
		this.fieldsContainer.alpha = 0;
		this.fieldsMask = new PIXI.Graphics();
		this.fieldsContainer.mask = this.fieldsMask;
		this.fieldsContainer.addChild(this.playerHighlight);

		this.columns = dStngs.xPositions.length;
		this.tFields = [];
		this.tFieldsText = [];
		for (let i = 0; i < this.columns; i++) {
			this.tFields[i] = new PIXI.Text('', {
				fontFamily: dStngs.fonts[2],
				fill: dStngs.fontColors[2],
				lineHeight: this.LINE_HEI,
				align: 'center',
				fontWeight: 'bold'
			});

			this.fieldsContainer.addChild(this.tFields[i]);
			this.tFields[i].x = dStngs.xPositions[i];
			this.tFieldsText[i] = '';
			this.tFields[i].anchor.set(0.5, 0);
		}
		this.addChild(this.fieldsContainer, this.fieldsMask);
		this.setupDisplay(dVars, dStngs);
	}

	setupDisplay(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		this.fieldsMask.clear();
		this.fieldsMask.beginFill(0xffffff);
		this.fieldsMask.drawRect(-248, -8, 500, 230);
		// this.fieldsMask.drawRect(-248, -8, 500, 306);
		this.baseY = 0;
		this.fieldsContainer.position.set(this.FIELDS_X, this.baseY);
		this.setMinY();
		this.updateFontSizes(dVars, dStngs);
		for (let i = 0; i < this.columns; i++) {
			this.tFields[i].resolution = dVars.textResolution;
		}
	}

	updateFontSizes(dVars:DisplayVars, dStngs:HSDisplaySettings) {
		let fontSizes = dVars.orient === 0 ? dStngs.fontSizes : dStngs.fontSizesPort;
		for (let i = 0; i < this.columns; i++) {
			this.tFields[i].style.fontSize = fontSizes[2];
		}
	}

	getFieldsY() {
		return this.fieldsContainer.y - this.baseY;
	}

	showPlayerHighlight(pPos:number) {
		this.playerHighlight.visible = true;
		this.playerHighlight.y = this.LINE_HEI * pPos;
		let off = pPos;
		if (off <= 4)off = 0;
		if (off > 4)off -= 4;
		this.fieldsContainer.y = this.baseY - this.LINE_HEI * off;
		if (this.fieldsContainer.y >= this.baseY) this.fieldsContainer.y = this.baseY;
		if (this.fieldsContainer.y <= this.minY) this.fieldsContainer.y = this.minY;
	}

	showLastYPosition(yOff:number) {
		this.playerHighlight.visible = false;
		this.fieldsContainer.y = this.baseY + yOff;
	}

	showScores(scoresSet:HSScoresLine[], dir:number, curSet:number) {
		this.displayScores(scoresSet, curSet);
		this.setMinY();
		this.fieldsContainer.x = this.FIELDS_X + (20 * dir);
		this.fieldsContainer.alpha = 0;
		this.linesTween = gsap.to([this.fieldsContainer], { duration: 0.4, alpha: 1, x: this.FIELDS_X });
	}

	displayScores(scoresSet:HSScoresLine[], curSet:number) {
		for (let i = 0; i < this.tFields.length; i++) this.tFieldsText[i] = '';
		this.rowsCount = scoresSet.length;
		if(this.lineType==='score'){
			for (let i = 0; i < this.rowsCount; i++) {
				let dateLine=this.getDateLine(scoresSet[i].dote,curSet);
				this.addScoreLine(i + 1, scoresSet[i], dateLine);
			}
		}
		if(this.lineType==='movesTime'){
			for (let i = 0; i < this.rowsCount; i++) {
				let dateLine=this.getDateLine(scoresSet[i].dote,curSet);
				this.addMovesTimeLine(i + 1, scoresSet[i], dateLine);
			}
		}
		if(this.lineType==='scoreTime'){
			for (let i = 0; i < this.rowsCount; i++) {
				let dateLine=this.getDateLine(scoresSet[i].dote,curSet);
				this.addScoreTimeLine(i + 1, scoresSet[i], dateLine);
			}
		}
		for (let i = 0; i < this.tFields.length; i++) {
			this.tFields[i].text = this.tFieldsText[i];
		}
	}

	getDateLine(date:string,curSet:number){
		if (curSet !== 0) {
			let myDate = new Date(date);
			if (curSet === 1)return myDate.getFullYear().toString();
			let myMon = this.MONTH_TEXTS[myDate.getMonth()];
			let myDay = myDate.getDate();
			return myDay + '-' + myMon;
		} else {
			return date;
		}
	}

	setMinY() {
		if (this.rowsCount <= this.NUM_ROWS) {
			this.minY = this.baseY;
		} else {
			this.minY = this.baseY - ((this.rowsCount - this.NUM_ROWS) * this.LINE_HEI);
		}
	}

	scrollUp() {
		let curY = this.fieldsContainer.y;
		let tarY = curY + this.LINE_HEI;
		if (tarY >= this.baseY)tarY = this.baseY;
		this.fieldsContainer.y = tarY;
	}

	scrollDown() {
		let curY = this.fieldsContainer.y;
		let tarY = curY - this.LINE_HEI;
		if (tarY <= this.minY)tarY = this.minY;
		this.fieldsContainer.y = tarY;
	}

	reset() {
		this.rowsCount = 0;
		this.fieldsContainer.position.set(this.FIELDS_X, this.baseY);
	}

	addScoreLine(ind:number, scoreEntry:HSScoresLine, dateLine:string) {
		this.tFieldsText[0] += ind + '\r\n';
		this.tFieldsText[1] += scoreEntry.nom + '\r\n';
		this.tFieldsText[2] += scoreEntry.score + '\r\n';
		this.tFieldsText[3] += dateLine + '\r\n';
		this.tFieldsText[4] += scoreEntry.local + '\r\n';
	}

	addMovesTimeLine(ind:number, scoreEntry:HSScoresLine, dateLine:string) {
		this.tFieldsText[0] += ind + '\r\n';
		this.tFieldsText[1] += scoreEntry.nom + '\r\n';
		this.tFieldsText[2] += scoreEntry.moves + '\r\n';
		this.tFieldsText[3] += scoreEntry.time + '\r\n';
		this.tFieldsText[4] += dateLine + '\r\n';
		this.tFieldsText[5] += scoreEntry.local + '\r\n';
	}

	addScoreTimeLine(ind:number, scoreEntry:HSScoresLine, dateLine:string) {
		this.tFieldsText[0] += ind + '\r\n';
		this.tFieldsText[1] += scoreEntry.nom + '\r\n';
		this.tFieldsText[2] += scoreEntry.score + '\r\n';
		this.tFieldsText[3] += scoreEntry.time + '\r\n';
		this.tFieldsText[4] += dateLine + '\r\n';
		this.tFieldsText[5] += scoreEntry.local + '\r\n';
	}
}


//this should match the type in display.ts - it is added here so that highscores doesnt rely on anything else
interface DisplayVars{
	scale:number;
	orient: number;
	orientChanged: boolean;
	width: number;
	height: number;
	textResolution: number;
}

interface HSSettings{
	URL: string,
	SCORE_TYPE: string[],
	TABLE_TYPE: string,
	SCORES_TABLE: string,
	OFFLINE_TYPE: string
};

interface HSDisplaySettings{
	adjustYs: number[],
	fonts: string[],
	fontColors: number[],
	fontSizes: number[],
	fontSizesPort: number[],
	seqArrowsWidth: number,
	backPaneColors: number[],
	backPaneMargin: number,
	backPaneAlpha: number,
	scoresPaneMargin: number,
	scoresPaneAlpha: number,
	highlightColors: number[],
	highlightAlpha: number,
	submitBorder: number,
	entryMaxLength: number,
	entryShadeWidth: number,
	arrowColor: number,
	arrowStroke: number,
	titleLabels: string[],
	xPositions: number[],
};

interface HSScoresLine{
	nom: string,
	local: string,
	id:number,
	score: number,
	time:number,
	moves:number,
	dote: string
}

interface HSObject{
	[key:number]:HSScoresLine[]
}

//this utils duplicates some functions in general/utils
//this is to keep the highscores stuff encapsulated and as indepdent from rest of code

function makeArrow(g:PIXI.Graphics, size:number, s:number, f:number) {
	g.clear();
	g.beginFill(f);
	g.lineStyle(1, s);
	g.arc(0, 0, size * 0.56, -1, 1);
	g.arc(-size, size, size * 0.40, 1, Math.PI);
	g.arc(-size, -size, size * 0.40, Math.PI, -1);
	g.closePath();
}

function makeRect(g:PIXI.Graphics, w:number, h:number, r:number, s:number, f:number) {
	g.clear();
	g.beginFill(f);
	g.lineStyle(1, s);
	g.drawRoundedRect(-w / 2, -h / 2, w, h, r);
}

function makeRectWithBorder(g:PIXI.Graphics, w:number, h:number, r:number, r2:number, m:number, c0:number, c1:number, c2:number, c3:number) {
	g.clear();
	g.lineStyle(1, c0);
	g.beginFill(c1);
	g.drawRoundedRect(-w / 2, -h / 2, w, h, r);
	w -= m;
	h -= m;
	g.lineStyle(1, c2);
	g.beginFill(c3);
	g.drawRoundedRect(-w / 2, -h / 2, w, h, r2);
}

function capitalizeFirst(inText:string) {
	return inText.charAt(0).toUpperCase() + inText.slice(1);
}
