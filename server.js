var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const PORT_NO = process.env.PORT || 8080;
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use('/status', function (req, res) {
    res.status(200).send({
        status: 200,
        message: 'ok'
    });
});

app.use(function (req, res, next) {
    console.log('Login verification here...');
    next();
});

app.use('/', require('./api/controllers/index.js'));

var server = app.listen(PORT_NO, function () {
    console.log('Server is running on port no:', PORT_NO);
});