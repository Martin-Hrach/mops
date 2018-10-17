const app = require('express')();
require('util').inspect.defaultOptions.depth = null
const path = require("path");
const https = require("https");
const ejs = require('ejs');
const cmd = require('node-cmd');
const lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('test.txt')
});


const streamers = ["grimmmz","smoke","kotton","nl_kripp"];
const allResponse = [];
app.locals.allResponse = allResponse

streamers.forEach((streamer,i) => {
	https.get({
		hostname: 'api.twitch.tv',
		path: '/kraken/channels/'+streamer+'/videos?broadcast_type=archive',
		method: 'GET',
		headers: {
			'Client-ID': '3gx16c6mkdnv928hqo7y8rbgdke6c3',
			'Authorization': 'OAuth ij3hiav0u7nn7v1shrsy38xacsn78e'
							}
		}, function(res) {
				let info = ""
			res.on('data', function(dataFlow) {
				info += dataFlow
		});
			res.on('end', function() {
				let d = new Date()
 			  let datestring = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate()
        allResponse.push(JSON.parse(info).videos.filter(a => a.published_at.slice(0,10) == "2018-10-14"))
			  //tahle část je funkční, filtruje requesty a ukládá jen data o videích která byla
			  //publikovaná v určeném datu
	      if(i == streamers.length-1) { reqcom() } //tady neco nesedí bude nutné předělat
	  });
	})
});

function reqcom() { console.log("test uspešný: " + allResponse.length)
 										console.log(JSON.stringify(allResponse[1], null, 2))
}





var test = ["321144245","321144058","323320304"]

cmd.run(console.log(`startuje stahovaní chetů, celkový počet: ${test.length-1}`))
test.forEach((a,i) => cmd.get(` cd.. & cd twitchChat & rechatTool -D ${a}`,
	function(err, data, stderr){
					if(!err) {console.log("žádný problém nenalezen")}
					console.log(`stažení souboru ${i} dokončeno`,stderr)
					if(i == test.length-1) { done(i+1); }
			})
		)
// logika dokončena, spustí stahování chatu cílového streamu po dokončení zavolá callback
// po dokončení stahování všech souborů zavola funcki done
function done(info) { console.log(`Všechny úspěšně dokončeno, celkem staženo: ${info}`) }


app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

/*** variables ***/
let timeArr = [];
let lulWords = [];
let sadWords = [];
app.locals.timeArr = timeArr;
app.locals.lulWords = lulWords;
app.locals.sadWords = sadWords;

let time = 0;
let lul = 0;
let sad = 0
/****************/

lineReader.on('line', function (line) {
	let reg = /\[(.*?)\]/,  lookingForLul = (/\b lul \b|lol|lool|haha|hahaa|omegalul|omegalol|lmao|rofl|omfg|lmfao|ez|pog|clap|wow|poggers|kreygasm|rekt|clip /);
	let lookingForSad = (/\b biblethump \b|notlikethis|pepehands|sad|cry|rip|feelswierman|feelsbadman|monkas|pepewhy /);
	let item = line.match(reg);
	let allSmall = line.toLowerCase();
	;

	if(allSmall.match(lookingForSad)) { sad += 1
		//console.log("sad : " +sad)
		//console.log(line)
	}
    if(allSmall.match(lookingForLul)) { lul += 1 }

	if(item[1].length === 12) { //target controlor
		let splitedItem = item[1].slice(0,8).split(":");
		let convertTime = (+splitedItem[0]) * 60 * 60 + (+splitedItem[1]) * 60 + (+splitedItem[2]);
		let date = new Date(null);
			date.setSeconds(convertTime-30); // specify value for SECONDS here
    	let result = date.toISOString().substr(11, 8);

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
})
;
app.listen(3000, function () {
console.log("Server is running on port mops");
console.log("allResponse: " + allResponse.length)
});
