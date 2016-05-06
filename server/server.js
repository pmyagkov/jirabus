var express = require('express');
var app = express();
var request = require('request');

app.post('/feedback', function (req, res) {
  var text = req.body.text + '\n\n' + req.body.name;
  var url = 'https://api.telegram.org/bot190843896:AAFchCFzLnhq-H9FG0wZABviItMBA3_HCuo/sendMessage';
  var data = {chat_id: '@JIRAbusFeedback', text: text};

  request.post({ url: url, form: data }, function (err, httpResponse, body) {
    console.log('BODY', body);

    var text;
    if (err || !body.ok) {
      text = JSON.stringify(err) + '\n\n' + JSON.stringify(body);
      res.status(502).send(text);
    } else {
      res.status(200).end();
    }

  });
});

app.listen(8000, function () {
  console.log('Example app listening on port 8000!');
});
