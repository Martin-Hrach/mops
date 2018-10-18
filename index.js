const app = require('express')();
//const player = require('play-sound')(); přidat až ke konci projectu
const fs = require('fs');
const path = require("path");
const https = require("https");
const ejs = require('ejs');
const cmd = require('node-cmd');
const lineReader = require('readline').createInterface({
	input: fs.createReadStream('test.txt')
});

const dirpath = path.join(__dirname, './twitchChat') // get=> všechny soubory ve složce twitchChat skoncovkou .txt
const streamers = ["grimmmz","smoke","kotton","nl_kripp"];
const allResponse = [];
//app.locals.allResponse = allResponse

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
 			  const datestring = `${d.getFullYear()} - ${d.getMonth()+1} - ${d.getDate()}`;

        allResponse.push(JSON.parse(info).videos.filter(a => a.published_at.slice(0,10) == "2018-10-14"))
			  //tahle část je funkční, filtruje requesty a ukládá jen data o videích která byla publikovaná v určeném datu
	      if(allResponse.length === streamers.length) { requestsComplet() } //čekání na vyplnění všech requestů a následné volání funkce
	  	});
		})
});

function requestsComplet() {
		const videosID = [].concat(...allResponse).map(a => a._id.slice(1))

		console.log(`počet objektů v array: ${allResponse.length}`)
		//console.log(JSON.stringify(allResponse[3], null, 2))
		//console.log(JSON.stringify(videosID, null, 2))
		cmdDonwload(videosID);
};

const testRes = [] // ukládání reponse pro zajištění podmínky při čekání na vyplnení úkolů

function cmdDonwload(videosID) {
	cmd.run(console.log("Spouštím stahovnání...\n"))
	videosID.forEach((a,i) => cmd.get(`cd twitchChat & rechatTool -D ${a}`,
		function(err, data, stderr){
						if(err) {console.log(`tento soubor již exituje`)}
						testRes.push(data)
						console.log(`stažení souboru ${i+1} z ${videosID.length} dokončeno`)
						if(testRes.length === videosID.length) { done(videosID.length); };
		})
	)
};
// logika dokončena, spustí stahování chatu cílového streamu po dokončení zavolá callback
// po dokončení stahování všech souborů zavola funcki done

function done(info) {
	fs.readdir(dirpath, function(err, files) {
		const txtFiles = files.filter(el => /\.txt$/.test(el))
		console.log(txtFiles)
	});
	console.log(`Všechny soubory úspěšně zpracovány, celkem staženo: ${info}`)

	/*player.play('./mech.mp3', (err) => {
		if (err) console.log(`Could not play sound: ${err}`); nainstalovat mpplayer a pak nastavit path pro windows:/
	});*/
};

// =================== ZDE JE PROZATÍM VŠE DOKONČENO ==================================
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

/*** variables ***/
const timeArr = [];
const lulWords = [];
const sadWords = [];
app.locals.timeArr = timeArr;
app.locals.lulWords = lulWords;
app.locals.sadWords = sadWords;

let time = 0;
let lul = 0;
let sad = 0;
/****************/

lineReader.on('line', function (line) {
	const reg = /\[(.*?)\]/;
	const lookingForLul = (/\b lul \b|gachigasm|lol|lool|haha|hahaa|omegalul|omegalol|lmao|rofl|omfg|lmfao|ez|pog|clap|wow|poggers|pogchamp|hypers|kreygasm|elegiggle|4head|rekt|clip /);
	const lookingForSad = (/\b biblethump \b|failfish|babyrage|notlikethis|pepehands|sad|cry|rip|feelswierman|feelsbadman|monkas|pepewhy|dansgame /);
	const item = line.match(reg);
	const allSmall = line.toLowerCase();

	if(allSmall.match(lookingForSad)) { sad += 1
		//console.log("sad : " +sad)
		//console.log(line)
	}
    if(allSmall.match(lookingForLul)) { lul += 1 }

	if(item[1].length === 12) { //target controlor
		const splitedItem = item[1].slice(0,8).split(":");
		const convertTime = (+splitedItem[0]) * 60 * 60 + (+splitedItem[1]) * 60 + (+splitedItem[2]);
		let date = new Date(null);
				date.setSeconds(convertTime-30) // specify value for SECONDS here
    const result = date.toISOString().substr(11, 8);

		if ( (convertTime - time) >= 60 ) { //vložit do array každou časovou jednotku a vynulovat počty nalezených slov
			timeArr.push(result)
			lulWords.push(lul)
			sadWords.push(sad)

			lul = 0;
			sad = 0;
			time = convertTime;
		}
  }
	//console.log('Line from file:', allSmall);
});

lineReader.on('close', function (data) {
	//console.log(Math.max(...lulWords))
	//console.log(lulWords.indexOf(Math.max(...lulWords)))
});

app.get("/", function(req,res){
	res.render("index")
});

app.listen(3000, function () {
console.log("mops server je nastartován \n");
});
