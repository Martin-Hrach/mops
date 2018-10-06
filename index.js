const express = require('express')
const exphbs = require('express-handlebars')

const app = express()

app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

let data = "nějaka data";


app.get('/', function(req, res) {
  res.render('../views/home',{data});
});

app.listen(3000, function(){
  console.log("start")
});
