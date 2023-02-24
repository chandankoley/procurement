const express = require('express');
const moment = require('moment');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const MAX_COLLECTION_SIZE = 100000;
const DB_NAME = "inventory";
const PURCHASE_TABLE = "purchase";
const LOGIN_TABLE = "login";
const WISH_TABLE = "wish";
var mailer = require("../models/mailer");

var otpValidationCount = {};

router.use('/public',express.static(path.join(__dirname, '../../web')));

router.get('/login', function (req, res) {
    res.send(fs.readFileSync(path.join(__dirname, '../../web/login/index.html'), 'ascii'));
});

router.post('/api/send-otp', function (req, res) {
    if(req.body.user_id) {
        otpValidationCount[encodeURIComponent(req.body.user_id)] = 10;
        MongoClient.connect(process.env.MONGO_URL, function(err, db) {
            if (err) 
                res.sendStatus(500);
            db.db(DB_NAME).collection(LOGIN_TABLE).find({user_id: encodeURIComponent(req.body.user_id)}).limit(1).toArray(function (err, dbData) {
                if (err) {
                    res.sendStatus(500);
                } else if (dbData[0]) {
                    var otp = _.random(111111, 999999).toString();
                    mailer.sendMail({
                        to: dbData[0].email,
                        subject: "SmartBuy OTP Notification",
                        body: "<p>To login into your account, use OTP - <b>" + otp + "</b>. Never share your OTP to anyone. SmaryBuy never ask OTP in call.</p>"
                    });
                    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
                        if (err) 
                            res.sendStatus(500);
                            db.db(DB_NAME).collection(LOGIN_TABLE).updateOne({user_id: encodeURIComponent(req.body.user_id)}, { $set: {otp: otp}}, function(err) {
                            if (err) 
                                res.sendStatus(500);
                            else
                                res.send("OTP has been shared to your email");
                            db.close();
                        });
                    });
                } else {
                    res.send("User ID not found");
                }
                db.close();
            });
        });
    } else {
        res.send("Invalid User ID");
    }
});

router.post('/api/verify-otp', function (req, res) {
    if(req.body.user_id && req.body.otp && otpValidationCount[encodeURIComponent(req.body.user_id)] > 0) {
        otpValidationCount[encodeURIComponent(req.body.user_id)]--;
        console.log("otpValidationCount::", JSON.stringify(otpValidationCount));
        MongoClient.connect(process.env.MONGO_URL, function(err, db) {
            if (err) 
                res.sendStatus(500);
            db.db(DB_NAME).collection(LOGIN_TABLE).find({user_id: encodeURIComponent(req.body.user_id)}).limit(1).toArray(function (err, dbData) {
                if (err) {
                    res.sendStatus(500);
                } else if (dbData[0] && dbData[0].otp === encodeURIComponent(req.body.otp)) {
                    var passcode = _.random(11111, 99999) + "-" + _.random(11111, 99999) + "-" + _.random(11111, 99999) + "-" + _.random(11111, 99999);
                    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
                        if (err) 
                            res.sendStatus(500);
                            db.db(DB_NAME).collection(LOGIN_TABLE).updateOne({user_id: encodeURIComponent(req.body.user_id)}, { $set: {'passcode': passcode, 'session_time': moment().add(1, 'days').format("YYYYMMDDHHmmss")}}, function(err) {
                            if (err) 
                                res.sendStatus(500);
                            else
                                res.send({"passcode": passcode});
                            db.close();
                        });
                    });
                } else {
                    res.sendStatus(401);
                }
                db.close();
            });
        });
    } else {
        res.sendStatus(401);;
    }
});

router.get('/', function (req, res) {
    res.send(fs.readFileSync(path.join(__dirname, '../../web/purchase/index.html'), 'ascii'));
});

router.get('/chart', function (req, res) {
    res.send(fs.readFileSync(path.join(__dirname, '../../web/chart/index.html'), 'ascii'));
});

router.use(function (req, res, next) {
    console.log('Login verification here::' + req.headers["auth-info"]);
    var passcode = encodeURIComponent(req.headers["auth-info"]);
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
        db.db(DB_NAME).collection(LOGIN_TABLE).find({passcode: passcode}).limit(1).toArray(function (err, dbData) {
            if (err) {
                res.sendStatus(500);
            } else if (dbData[0] && moment(dbData[0].session_time,'YYYYMMDDHHmmss').isAfter()) {
                req['uInfo'] = {
                    user_id: dbData[0].user_id,
                    email: dbData[0].email,
                    name: dbData[0].name
                };
                next();
            } else {
                res.sendStatus(401);
            }
            db.close();
        });
    });
});

router.get('/api/is-valid-session', function (req, res) {
    res.send(req.uInfo);
});

router.post('/api/get-purchase-item', function (req, res) {
    var searchObj = {};
    if(req.body.titleStr && req.body.titleStr !== '') {
        searchObj['title'] = new RegExp(`${req.body.titleStr}`, "gi");
    }
    if(req.body.sdt && req.body.edt) {
        searchObj = _.extend(searchObj,{
            "$expr": {
                "$and": [
                    {"$gte" : [{"$toInt" :"$date"} , _.parseInt(req.body.sdt)]},
                    {"$lte" : [{"$toInt" :"$date"} , _.parseInt(req.body.edt)]}
                ]
            }
        });
    }
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(PURCHASE_TABLE).find(searchObj).limit(MAX_COLLECTION_SIZE).toArray(function (err, dbData) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    dbData = _.chain(dbData).orderBy(['title', 'date'], ['asc', 'desc']).reduce(function(memo, obj) {
                        obj.date = moment(obj.date, 'YYYYMMDD').format('DD/MM/YYYY');
                        var index = _.findIndex(memo, {'title': obj.title});
                        if(index >= 0){
                            memo[index].details.push(obj);
                        } else {
                            memo.push({
                                'title': obj.title,
                                'type': obj.type,
                                'details': [obj]
                            });
                        }
                        return memo;
                    }, []).value();
                    res.send(dbData);
                }
                db.close();
            });
        });
    });

router.post('/api/add-purchase-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(PURCHASE_TABLE).insertOne(req.body, function(err) {
            if (err) 
                res.sendStatus(500);
            else
                res.sendStatus(200);
            db.close();
        });
    });
});

router.post('/api/delete-purchase-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(PURCHASE_TABLE).deleteOne(req.body, function(err) {
            if (err) 
                res.sendStatus(500);
            else
                res.sendStatus(200);
            db.close();
        });
    });
});

router.get('/api/get-wish-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(WISH_TABLE).find().toArray(function (err, dbData) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    dbData = _.chain(dbData).orderBy(['type', 'title'], ['asc', 'asc']).reduce(function(memo, obj) {
                        var formattedType = obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
                        var index = _.findIndex(memo, {'type': formattedType});
                        if(index >= 0){
                            memo[index].details.push(obj);
                        } else {
                            memo.push({
                                'type': formattedType,
                                'details': [obj]
                            });
                        }
                        return memo;
                    }, []).value();
                    res.send(dbData);
                }
                db.close();
            });
    });
});

router.post('/api/add-wish-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(WISH_TABLE).insertOne(req.body, function(err) {
            if (err) 
                res.sendStatus(500);
            else
                res.sendStatus(200);
            db.close();
        });
    });
});

router.post('/api/delete-wish-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(WISH_TABLE).deleteOne(req.body, function(err) {
            if (err) 
                res.sendStatus(500);
            else
                res.sendStatus(200);
            db.close();
        });
    });
});

router.get('/api/update-wish-item-important-flag', function (req, res) {
    if(req.query && req.query.id && req.query.isImportant) {
        MongoClient.connect(process.env.MONGO_URL, function(err, db) {
            if (err) 
                res.sendStatus(500);
                db.db(DB_NAME).collection(WISH_TABLE).updateOne({id: req.query.id}, { $set: {important: req.query.isImportant}}, function(err) {
                if (err) 
                    res.sendStatus(500);
                else
                    res.sendStatus(200);
                db.close();
            });
        });
    } else {
        res.sendStatus(500);
    }
});

router.get('/api/get-distinct-purchase-item', function (req, res) {
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
        db.db(DB_NAME).collection(PURCHASE_TABLE).distinct('title').then(function (distinctDbData) {
            res.send(distinctDbData);
            db.close();
        }).catch(function(e) {
            console.error('Faild get-distinct-purchase-item ::', e);
            res.sendStatus(500);
            db.close();
        });
    });
});

module.exports = router;