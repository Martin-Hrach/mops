const app = require('express')();
const player = require('play-sound')(); //přidat až ke konci projectu
const fs = require('fs'), readline = require('readline');
const path = require("path");
const https = require("https");
const ejs = require('ejs');
const cmd = require('node-cmd');

const dirpath = path.join(__dirname, './twitchChat') // get=> všechny soubory ve složce twitchChat skoncovkou .txt
const streamers = ["grimmmz", "smoke", "kotton", "nl_kripp", "drdisrespectlive", "shroud", "scump","admiralbahroo", "imaqtpie",
 									 "forsen", "grinninggoat", "sjow", "amazhs", "loltyler1", "sodapoppin", "anton", "summit1g", "drlupo", "goldglove", "nickmercs", "worrun_tv"]; 
const allResponse = []; // ukládání response pro api call() funkci zajištění podmínky při čekání na vyplnení úkolů
const testRes = []; // ukládání response pro cmdDonwload() funkci zajištění podmínky při čekání na vyplnení úkolů
const arrObj = [];
app.locals.arrObj = arrObj;

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// loop request o videa zadaných streamerů
streamers.forEach(streamer => {
	https.get({
		hostname: "api.twitch.tv",
		path: `/kraken/channels/${streamer}/videos?broadcast_type=archive`,
		method: 'GET',
		headers: {
			'Client-ID': '3gx16c6mkdnv928hqo7y8rbgdke6c3',
			'Authorization': 'OAuth ij3hiav0u7nn7v1shrsy38xacsn78e'
							}
		}, function(res) {
				let info = "";

			res.on('data', function(dataFlow) {
				info += dataFlow
			});

			res.on('end', function() {
				const d = new Date();
 			  const datestringLast = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()-1}`;
				const today = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

        allResponse.push(JSON.parse(info).videos.filter(a => //a.published_at.slice(0,10).toString() == datestringLast && a.length > 3600 ||
				 																										 a.published_at.slice(0,10).toString() == today && a.length > 3600 ))
			  // filtruje requesty a ukládá jen data o videích která byla publikovaná v určeném datua určité délky
	      if(allResponse.length === streamers.length) { requestsComplete() } //čekání na vyplnění všech requestů a následné volání funkce

	  	});
		})
});

function requestsComplete() {
		const videosID = [].concat(...allResponse).map(a => a._id.slice(1))
		console.log(`počet objektů v array: ${allResponse.length}`)
		//console.log(JSON.stringify(allResponse, null, 2))
		//console.log(JSON.stringify(videosID, null, 2))
		console.log(videosID)
		cmdDonwload(videosID);
};

function cmdDonwload(videosID) {
	console.log(`Spouštím stahovnání...\n`)
	let count = 1;
	videosID.forEach((a,i) => cmd.get(`cd twitchChat & rechatTool -D ${a}`,
		function(err, data, stderr){
						if(err) {console.log(`tento soubor již exituje ${err}`)}
						testRes.push(data)
						console.log(`stažení ${count} souboru z ${videosID.length} dokončeno`)
						count++
						if(testRes.length === videosID.length) { done(videosID.length) }
		})
	);
};// po dokončení stahování všech souborů zavola funcki done

function done(info) {
	fs.readdir(dirpath, function(err, files) {
		const txtFiles = files.filter(el => /\.txt$/.test(el))
		console.log(txtFiles)
		txtFiles.forEach(item => lineReader(item))
	});
	console.log(`Všechny soubory úspěšně zpracovány, celkem staženo: ${info}`)
	player.play('./mech.mp3', (err) => {
		if (err) console.log(`Could not play sound: ${err}`); // nainstalovat mpplayer a pak nastavit path pro windows:/
	});
};

function lineReader(textID) {
  let target = [].concat(...allResponse).filter(target => target._id == "v"+ textID.slice(0,9));
	let makeObj = { info: target[0], time: [], lul: [], sad: [], activity: [], err: [] };
	let time = 0;
	let lul = 0;
	let sad = 0;
  let activity = 0;
	console.log("hodnota filtru target: " +target)
	console.log("čtu data text souboru: " + textID)

	let lineReader = readline.createInterface({
			input: fs.createReadStream(`./twitchChat/${textID}`)
		});

	lineReader.on('line', function (line) { //DOKONČENO 19.10
		const reg = /\[(.*?)\]/;
		const lookingForLul = (/\b lul \b|gachigasm|lol|lool|haha|hahaa|omegalul|omegalol|lmao|rofl|omfg|lmfao|ez|pog|clap|wow|poggers|pogchamp|hypers|kreygasm|elegiggle|4head|rekt|clip /);
		const lookingForSad = (/\b biblethump \b|failfish|babyrage|notlikethis|pepehands|sad|cry|rip|feelswierman|feelsbadman|monkas|pepewhy|dansgame /);
		const item = line.match(reg) || [0,111111111111]
		const allSmall = line.toLowerCase();

    activity += 1
		if(allSmall.match(lookingForSad)) { sad += 1 }
	  if(allSmall.match(lookingForLul)) { lul += 1 }

    if(item[1] == 111111111111) { console.log("nalezena vyjimka") ; makeObj.err.push(item[1]) } //patrani po bugu
		if(item[1].length === 12) {
      //primitivní kontrola jestli se jedná o časový údaj ve správném formátu
			const splitedItem = item[1].slice(0,8).split(":");
			const convertTime = ( +splitedItem[0]) * 60 * 60 + (+splitedItem[1]) * 60 + (+splitedItem[2] );
			let date = new Date(null);
					date.setSeconds(convertTime) // specify value for SECONDS here
	    const result = date.toISOString().substr(11, 8);

			if ( (convertTime - time) >= 15 ) { //vložit do array každou časovou jednotku a vynulovat počty nalezených slov
				makeObj.time.push(result)
				makeObj.lul.push(lul)
				makeObj.sad.push(sad)
        makeObj.activity.push(activity)
				lul = 0; sad = 0; activity = 0;	time = convertTime;
			}
	  }
		//console.log('Line from file:', allSmall);
	});

	lineReader.on('close', function (data) {
		arrObj.push(makeObj)
		//console.log(JSON.stringify(arrObj, null, 2))
		console.log(arrObj.length)
	});
};

app.get("/", function(req,res){
	res.render("index")
});

app.listen(3000, function () {
console.log("mops server je nastartován \n");
});
