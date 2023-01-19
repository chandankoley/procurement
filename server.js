var express = require('express');
var app = express();
var mongo = require('./mongo');
const PORT_NO = process.env.PORT || 8080;

app.use('/status', function (req, res) {
    res.status(200).send({
        status: 200,
        message: 'ok'
    });
});

var server = app.listen(PORT_NO, function () {
    console.log('Server is running on port no:', PORT_NO);
});