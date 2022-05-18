
const HSSettings = {
	URL: 'https://gtlescores.co.uk:5000',
	SCORE_TYPE: ['score'],
	TABLE_TYPE: 'score',
	SCORES_TABLE: "vocab_scores",
	OFFLINE_TYPE: 'score'
};

const HSDisplaySettings = {
	adjustYs: [12, 0],
	fonts: ['Lato, Arial', 'Lato, Arial', 'Lato, Arial'], //bigTitle, columnTitles, scorePane
	//fonts: ['Alegreya Sans', 'Alegreya Sans', 'Alegreya Sans'],
	//bigTitle, columnTitles, fields, scorePane, submit
	fontColors: [0x333333, 0x444444, 0x555555, 0x444444, 0x555555, 0x444444],
	fontSizes: [26, 22, 16, 16, 16],
	fontSizesPort: [28, 24, 18, 20, 22],
	seqArrowsWidth: 360,
	backPaneColors: [0x666666, 0xcccccc, 0x999999, 0xffffff], //backStroke, backFill, frontStroke, frontFill
	backPaneMargin: 10, //margin on backPane
	backPaneAlpha: 1,
	scoresPaneMargin: 8,
	scoresPaneAlpha: 1,
	highlightColors: [0x999999, 0xffff99], //stroke, fihighscoressettingsll
	highlightAlpha: 0.4,
	submitBorder: 1,
	entryMaxLength: 10,
	entryShadeWidth: 550,
	// arrowColor: 0xFFE695,
	arrowColor: 0xe3e3e3,
	arrowStroke: 0xbbbbbb,
	titleLabels: ['', 'Name', 'Score', 'Date', 'Location'],
	xPositions: [6, 94, 214, 298, 410]
};

let HSScores = [
	[//offline - 0
		{ nom: 'Newton', local: 'England', id:0, score: 10000, time:0, moves:0,  dote: '1687' },
		{ nom: 'Austen', local: 'England', id:1, score: 5000, time:0, moves:0, dote: '1811' },
		{ nom: 'Dickens', local: 'England', id:2, score: 2000, time:0, moves:0, dote: '1861' },
		{ nom: 'Orwell', local: 'England', id:3, score: 1000, time:0, moves:0, dote: '1847' },
		{ nom: 'Locke', local: 'England', id:4, score: 500, time:0, moves:0, dote: '1804' },
	],
	[], //scores - 1
	[], //scoresMonthly - 2
	[], //scoresWeekly - 3
	[]//scoresToday - 4
];

export { HSSettings, HSScores, HSDisplaySettings };
