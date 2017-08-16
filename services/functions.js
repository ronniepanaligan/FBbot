var request = require('request');
var Item = require('../models/item');

module.exports = {
  function processMessage(recipientId, msg) {
    //determines what state the bot should be in based on the quick reply chosen
    if(msg.quick_reply) {
      if(msg.quick_reply.payload === "ADD_ITEM") {
        sendMessage(recipientId, {text: "Please enter the product and price"});
        //state = 1 because the bot will send one more message indicating whether item has been added or not
        state = 1;
      } else if(msg.quick_reply.payload === "VIEW_ITEMS"){
        printItems(recipientId);
      } else {
        state = 2;
        sendMessage(recipientId, {text: "Sorry I don't understand your message"});
      }
    } else {
        if(state == 1) {
          addItem(recipientId, msg.text);
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
}
