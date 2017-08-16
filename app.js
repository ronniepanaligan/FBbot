var express = require('express');
var bodyParser = require('body-parser');

var db = mongoose.connect(process.env.MONGODB_URI);

var app = express();

require('./routes/authRoutes')(app);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));
