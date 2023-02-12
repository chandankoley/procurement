const express = require('express');
const moment = require('moment');
var router = express.Router();
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const DB_NAME = "inventory";
const PURCHASE_TABLE = "purchase";

router.use('/public',express.static(path.join(__dirname, '../../web')));

router.get('/', function (req, res) {
    res.send(fs.readFileSync(path.join(__dirname, '../../web/purchase/index.html'), 'ascii'));
});

router.post('/api/get-purchase-item', function (req, res) {
    var searchObj = {};
    if(req.body.titleStr !== '') {
        searchObj['title'] = new RegExp(`${req.body.titleStr}`, "gi");
    }
    MongoClient.connect(process.env.MONGO_URL, function(err, db) {
        if (err) 
            res.sendStatus(500);
            db.db(DB_NAME).collection(PURCHASE_TABLE).find(searchObj).toArray(function (err, dbData) {
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
                                'desc': obj.desc,
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

module.exports = router;