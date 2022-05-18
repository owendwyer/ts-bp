interface hashObjType {
  contentType: string;
  contentTitle: string;
  contentCode: number;
  taskTitle: string;
  contentUser: string;
  contentDate: string;
  contentAlteredItems:number[]
}

function getHashObj() {
  let hashObj: hashObjType = {
    contentType: "",
    contentTitle: "",
    contentCode: 0,
    taskTitle: "",
    contentUser: "",
    contentDate: "",
    contentAlteredItems:[]
  };
  let myHash = window.location.hash.slice(1).split('?')[0];
  if (!myHash) return hashObj;
  // myHash = myHash.toLowerCase();
  let firstPart = myHash.split("/")[0];
  let hashType = getHashType(firstPart);
  if (hashType === "site") processSiteHash(myHash, hashObj);
  if (hashType === "user") processUserHash(myHash, hashObj);
  if (hashType === "task") processTaskHash(myHash, hashObj);
  if (hashType === "altered") processAlteredHash(myHash, hashObj);
  return hashObj;
}

function getHashType(firstPart: string) {
  if(firstPart==='a')return 'altered';
  if(firstPart==='u')return 'user';
  if(firstPart==='t')return 'task';
  if(firstPart==='user')return 'user';
  if(firstPart==='task')return 'task';
  return 'site';
}

// eg. - #animals
function processSiteHash(myHash: string, hashObj: hashObjType) {
  hashObj.contentType = "site";
  hashObj.contentTitle = myHash;
}

// eg. - #user/fg/09/odwyer/testy
function processUserHash(myHash: string, hashObj: hashObjType) {
  //add more validity checking here
  //check not fg with @gmail.com
  //check date is valid
  //more stuff
  let hashSplit = myHash.split("/");
  for (let i = 0; i < hashSplit.length; i++) {
    //dont do this because some user emails have chars in
    //hashSplit[i]=hashSplit[i].replace(/[^a-zA-Z0-9]/g, '');
  }
  if (hashSplit.length !== 5) return;
  if (hashSplit[3].length < 3 || hashSplit[4].length < 3) return;
  hashObj.contentType = "user";
  hashObj.contentTitle = hashSplit[4];
  hashObj.contentDate = hashSplit[2];
  if (hashSplit[1].charAt(1) === "g") {
    hashObj.contentUser = hashSplit[3] + "@gmail.com";
  } else {
    hashObj.contentUser = hashSplit[3];
  }
}

// eg. - #task/odwyer@gmail.com/task2
function processTaskHash(myHash: string, hashObj: hashObjType) {
  //more validity checking here too
  let hashSplit = myHash.split("/");
  for (let i = 0; i < hashSplit.length; i++) {
    //dont do this because some user emails have chars in
    //  hashSplit[i]=hashSplit[i].replace(/[^a-zA-Z0-9@.]/g, '');
  }
  if (hashSplit.length !== 3) return;
  if (hashSplit[1].length < 3 || hashSplit[2].length < 3) return;
  hashObj.contentType = "task";
  hashObj.contentUser = hashSplit[1];
  hashObj.taskTitle = hashSplit[2];
}

// eg. - #a/colors/0506070809
function processAlteredHash(myHash: string, hashObj: hashObjType){
  hashObj.contentType='site';
  let hashSplit=myHash.split('/');
  if(hashSplit.length!==3)return;
  hashObj.contentTitle=hashSplit[1];
  let numString=hashSplit[2];
  numString=numString.replace(/[^0-9]/g, '');
  let numArray=[];
  let myLength=Math.floor(numString.length/2);
  for(let i=0;i<myLength;i++){
    let sNum=numString.substr(i*2,2);
    let iNum=parseInt(sNum,10);
    if(iNum>=0&&numArray.indexOf(iNum)===-1)numArray.push(iNum);
  }
  if(numArray.length<5)numArray=[];//make 5 const
  hashObj.contentAlteredItems=numArray;
}

export { getHashObj, hashObjType };
