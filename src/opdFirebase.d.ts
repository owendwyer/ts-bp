// import PIXI from 'pixi.js';
declare module "opdFirebase"{
  export function loadFirebase(modules:string[],callback:Function):void;
  export function getTaskDetails(userMail:string, taskTitle:string, callback:Function):void;
  export function createEntry(userMail:string, taskTitle:string, username:string, callback:Function):void;
  export function sendScore(sendObj:object, callback:Function):void;
  export function login(callback:Function):void;
  export function loadUserSets(userMail:string,callback:Function):void;
  export function updateUserSets(userMail:string,userSets:string[],userDates:string[],callback:Function):void;
  export function getIncrement(callback:Function):void;
  export function batchUpload(pathDir:string,uploadObj:object,progressCallback:Function,callback:Function):void;
  export function getUploadProgress():[number,number];
}
