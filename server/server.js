var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

app.use(bodyParser.urlencoded({ extended: true }));

app.post('/feedback', function (req, res) {
  var text = req.body.text || 'No text sent';
  var name = req.body.name || 'Anonymous';

  var message = text + '\n\n' + name;
  var url = 'https://api.telegram.org/bot190843896:AAFchCFzLnhq-H9FG0wZABviItMBA3_HCuo/sendMessage';
  var data = {chat_id: '@JIRAbusFeedback', text: message};

  request.post({ url: url, form: data }, function (err, httpResponse, body) {
    console.log('TELEGRAM RESPONSE', body);

    try {
      body = JSON.parse(body);
    } catch (e) {}

    res.set('Access-Control-Allow-Origin', '*');

    var text;
    if (err || !body.ok) {
      text = 'Request error: ' + JSON.stringify(err) + '\n\n' + 'Response payload: ' + JSON.stringify(body);
      res.status(502).send(text);
    } else {
      res.status(200).end('Success!');
    }

  });
});

app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
});
