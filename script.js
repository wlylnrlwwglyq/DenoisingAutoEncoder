const MODEL_PATH = "model/model.json";
const NUMBER_PEN = 1;
const NOISE_PEN = 2;
const HEIGHT = 28;
const WIDTH = 28;

let ctx;
let outputCtx;
let isDrawing;
let model;
let penType;

//キャンバスを初期状態に戻す
function cleanCanvas(){
	//手書き部分
	isDrawing = false;
	ctx.beginPath();
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,WIDTH,HEIGHT);
	outputCtx.fillStyle = "#FFFFFF";
	outputCtx.fillRect(0,0,WIDTH,HEIGHT);
}

//推論を行う
function predict(){
	if(!model) return; //モデルが読み込まれていない
	//画像からRGBを取得、値を入力層へ格納
	let imageData = ctx.getImageData(0,0,WIDTH,HEIGHT).data;
	let inputData = [];
	for(let i = 0;i < 784;i++){
		let gray = 1-(((imageData[i*4+0]+imageData[i*4+1]+imageData[i*4+2])/3)/255);
		inputData.push(gray);
	}
	//ノイズを削除する
	let x = tf.tensor1d(new Float32Array(inputData)).reshape([1,WIDTH,HEIGHT]);
	let y = model.predict(x).reshape([-1]).arraySync();
	//結果を描画する
	outputCtx.fillStyle = "#FFFFFF";
	outputCtx.fillRect(0,0,WIDTH,HEIGHT);
	for(let i = 0;i < HEIGHT;i++){
		for(let j = 0;j < WIDTH;j++){
			let gray = 255-(y[i*WIDTH+j]*255);
			outputCtx.fillStyle = "rgb("+gray+","+gray+","+gray+")";
			outputCtx.fillRect(j,i,1,1);
		}
	}
}


//モデルを読み込み
async function loadModel(){
	try{
		model = await tf.loadLayersModel(MODEL_PATH);
		document.getElementsByTagName("input")[2].disabled = false;
	}catch(err){
		alert("モデルの読み込みに失敗しました");
	}
}


//書き始め
function handleStart(x,y){
	if(penType == NUMBER_PEN){
		isDrawing = true;
		ctx.beginPath();
		ctx.moveTo(x,y);
	}else if(penType == NOISE_PEN){
		isDrawing = true;
		let gray = Math.floor(Math.random()*256);
		ctx.fillStyle = "rgb("+gray+","+gray+","+gray+")";
		ctx.fillRect(x,y,1,1);
	}
}

//書いている途中
function handleMove(x,y){
	if(penType == NUMBER_PEN){
		if(isDrawing){
			ctx.lineTo(x,y);
			ctx.stroke();
		}	
	}else if(penType == NOISE_PEN){
		if(isDrawing){
			let gray = Math.floor(Math.random()*256);
			ctx.fillStyle = "rgb("+gray+","+gray+","+gray+")";
			ctx.fillRect(x,y,1,1);
		}
	}
}

//書き終わり
function handleEnd(x,y){
	if(penType == NUMBER_PEN){
		ctx.lineTo(x,y);
		ctx.stroke();
	}
	isDrawing = false;
}


window.addEventListener("load",()=>{
	//変数を設定
	let canvas = document.getElementById("input");
	ctx = canvas.getContext("2d");
	outputCtx = document.getElementById("output").getContext("2d");

	//キャンバスをリセット
	cleanCanvas();

	//マウスイベントを登録
	canvas.addEventListener("mousedown",(e)=>{
		let x = e.offsetX/300*WIDTH;
		let y = e.offsetY/300*HEIGHT;
		handleStart(x,y);
	});
	canvas.addEventListener("mousemove",(e)=>{
		let x = e.offsetX/300*WIDTH;
		let y = e.offsetY/300*HEIGHT;
		handleMove(x,y);
	});
	canvas.addEventListener("mouseup",(e)=>{
		let x = e.offsetX/300*WIDTH;
		let y = e.offsetY/300*HEIGHT;
		handleEnd(x,y);
	});
	//タッチイベントを登録
	canvas.addEventListener("touchstart",(e)=>{
		e.preventDefault();
		let x = (e.changedTouches[0].pageX-canvas.getBoundingClientRect().left-window.pageXOffset)/300*WIDTH;
		let y = (e.changedTouches[0].pageY-canvas.getBoundingClientRect().top -window.pageYOffset)/300*HEIGHT;
		handleStart(x,y);
	});
	canvas.addEventListener("touchmove",(e)=>{
		e.preventDefault();
		let x = (e.changedTouches[0].pageX-canvas.getBoundingClientRect().left-window.pageXOffset)/300*WIDTH;
		let y = (e.changedTouches[0].pageY-canvas.getBoundingClientRect().top -window.pageYOffset)/300*HEIGHT;
		handleMove(x,y);
	});
	canvas.addEventListener("touchend",(e)=>{
		e.preventDefault();
		let x = (e.changedTouches[0].pageX-canvas.getBoundingClientRect().left-window.pageXOffset)/300*WIDTH;
		let y = (e.changedTouches[0].pageY-canvas.getBoundingClientRect().top -window.pageYOffset)/300*HEIGHT;
		handleEnd(x,y);
	});

	//最初は数字ペンを選択する
	useNumberPen();

	//モデルの読み込み
	loadModel();
});


function useNumberPen(){
	penType = NUMBER_PEN;
	if(isDrawing) isDrawing = false;
	document.getElementsByTagName("input")[0].style.fontWeight = 700;
	document.getElementsByTagName("input")[1].style.fontWeight = 400;
}

function useNoisePen(){
	penType = NOISE_PEN;
	if(isDrawing){
		ctx.stroke();
		isDrawing = false;
	}
	document.getElementsByTagName("input")[0].style.fontWeight = 400;
	document.getElementsByTagName("input")[1].style.fontWeight = 700;
}
