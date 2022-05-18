
export interface DisplayVars{
	scale:number;
	orient: number;
	orientChanged: boolean;
	width: number;
	height: number;
	textResolution: number;
}

export interface TextureMap{
	[name: string] : PIXI.Texture;
}
