require('../services/functions');

module.exports = function(app){
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
};
