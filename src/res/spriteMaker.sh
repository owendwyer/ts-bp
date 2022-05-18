#!/usr/bin/env bash
mkdir ./tmp
cp ./x1/*.* tmp/
cp ./x1/**/* tmp/
TexturePacker --format pixijs4 --sheet ../../dist/res/mainSprite.0.0.png --data ../jsons/mySprite.json --disable-rotation tmp
rm tmp/*
cp ./x1.3/*.* tmp/
cp ./x1.3/**/* tmp/
TexturePacker --format pixijs4 --sheet ../../dist/res/mainSprite.0.0@1.3x.png --data ../jsons/mySprite@1.3x.json --disable-rotation tmp
rm tmp/*
cp ./x1.6/*.* tmp/
cp ./x1.6/**/* tmp/
TexturePacker --format pixijs4 --sheet ../../dist/res/mainSprite.0.0@1.6x.png --data ../jsons/mySprite@1.6x.json --disable-rotation tmp
rm -rf tmp
sed -i '/\"animations\"/,/}/ d; /^$/d' ../jsons/mySprite.json
sed -i '/\"animations\"/,/}/ d; /^$/d' ../jsons/mySprite@1.3x.json
sed -i '/\"animations\"/,/}/ d; /^$/d' ../jsons/mySprite@1.6x.json
