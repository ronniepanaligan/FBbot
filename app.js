var express = require('express');
var bodyParser = require('body-parser');

var db = mongoose.connect(process.env.MONGODB_URI);

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

require('./routes/authRoutes')(app);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));
