var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var db = mongoose.connect(process.env.MONGODB_URI);
var Item = require('./models/item');

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.sendStatus(403);
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
  var events = req.body.entry[0].messaging;
  for (i = 0; i < events.length; i++) {
      var event = events[i];
      if (event.message && event.message.text) {
          if (!addItem(event.sender.id, event.message.text)) {
              printItems(event.sender.id);
          }
      } else if (event.postback) {
          console.log("Postback received: " + JSON.stringify(event.postback));
      }
  }
  res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message:{
              text:"Pick a color:",
              quick_replies:[
                {
                  content_type:"text",
                  title:"Red",
                  payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
                },
                {
                  content_type:"text",
                  title:"Green",
                  payload:"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
                }
              ]
            }
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

function addItem(recipientId, text) {

    text = text || "";
    var values = text.split(' ');

    if (values.length === 3 && values[0] === 'add') {
      var newItem = new Item({
        userId: recipientId,
        name: values[1],
        price: values[2]
      });

      newItem.save(function(err) {
        if (err) throw err;
      });

      sendMessage(recipientId, {text: values[1] + " added to database" });

      return true;

    }

    return false;

};

function printItems(recipientId) {
  Item.find({ userId: recipientId }, function(err, items) {

    if(err) throw err;

    var arrayLength = items.length;
    var total = 0;
    for(var i = 0; i < arrayLength; i++) {
      total = +total + +items[i].price;
    }
    console.log(total);
    sendMessage(recipientId, {text: total});
  });

}
