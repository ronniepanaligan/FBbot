var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoose = require('mongoose');

var db = mongoose.connect(process.env.MONGODB_URI);
var Item = require('./models/item');

var app = express();
/*
state keeps track of whether the conversation has ended or not.
The value of state indicates how many messages the bot has sent.
At this point the max number of steps is 2. Once the state is 2
and the sendMessage function is called, the conversation is finished
At the end of a conversation, the bot will resend the quick reply options.
*/
var state = 0;
var message = {
  text: "Choose from the following:",
  quick_replies: [
    {
      content_type: "text",
      title: "Add an item",
      payload: "ADD_ITEM"
    },
    {
      content_type: "text",
      title: "View all purchases",
      payload: "VIEW_ITEMS"
    }
  ]
};

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
      if(event.message) {
        console.log(JSON.stringify(event));
        processMessage(event.sender.id, event.message);
      } else if(event.postback) {
          console.log(JSON.stringify(event));
          processPostback(event.sender.id, event.postback.payload);
      }
  }
  res.sendStatus(200);
});

function processMessage(recipientId, text) {
  //determines what state the bot should be in based on the quick reply chosen
  if(text.quick_reply) {
    if(text.quick_reply.payload === "ADD_ITEM") {
      sendMessage(recipientId, {text: "Please enter the product and price"});
      //state = 1 because the bot will send one more message indicating whether item has been added or not
      state = 1;
    } else {
      printItems(recipientId);
    }
  } else {
      if(state == 1) {
        addItem(recipientId, text.text);
      } else {
        //state set to 2 because there was an error between the bot and user so conversation will be reset
        state = 2;
        sendMessage(recipientId, {text: "Sorry I don't understand your message"});
      }
    }
};

function processPostback(recipientId, postb) {
  // Start of conversation
  if(postb === "GET_STARTED_PAYLOAD") {
    sendMessage(recipientId, message);
  } else {
    sendMessage(recipientId, {text: "Error"});
  }
}

// generic function sending messages
function sendMessage(recipientId, message0) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message0,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else if(state == 2){
          //conversation is finished, resend quick_reply options
          console.log(response.body);
          state = 0;
          sendMessage(recipientId, message);
        }
    });
};

function addItem(recipientId, text) {

    text = text || "";
    var values = text.split(' ');

    if (values.length === 2) {
      var newItem = new Item({
        userId: recipientId,
        name: values[0],
        price: values[1]
      });

      newItem.save(function(err) {
        if (err) throw err;
      });
      //state has been set to 2 because the conversation will end and it needs to send quick_reply
      state = 2;
      sendMessage(recipientId, {text: values[1] + " added to database" });

    }
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
    //state has been set to 2 because the conversation will end and it needs to send quick_reply
    state = 2;
    sendMessage(recipientId, {text: total});
  });
}
