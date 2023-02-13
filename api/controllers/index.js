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
const WISH_TABLE = "wish";

router.use('/public',express.static(path.join(__dirname, '../../web')));

router.get('/', function (req, res) {
    res.send(fs.readFileSync(path.join(__dirname, '../../web/purchase/index.html'), 'ascii'));
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