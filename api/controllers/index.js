const express = require('express');
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

router.get('/api/get-purchase-item', function (req, res) {
    var dbData = [{
        "id": "111",
        "date": "01/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Alu",
        "type": "vegetable",
        "quantity": "3",
        "unit": "kg",
        "price": "90"
    }, {
        "id": "122",
        "date": "02/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Patol",
        "type": "vegetable",
        "quantity": "3",
        "unit": "kg",
        "price": "70"
    }, {
        "id": "133",
        "date": "01/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Makhon",
        "type": "grocery",
        "quantity": "3",
        "unit": "kg",
        "price": "400"
    }, {
        "id": "144",
        "date": "03/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Doi",
        "type": "grocery",
        "quantity": "3",
        "unit": "kg",
        "price": "60"
    }, {
        "id": "155",
        "date": "01/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Alu",
        "type": "vegetable",
        "quantity": "3",
        "unit": "kg",
        "price": "80"
    }, {
        "id": "116",
        "date": "01/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Makhon",
        "type": "grocery",
        "quantity": "2",
        "unit": "pc",
        "price": "46"
    }, {
        "id": "177",
        "date": "02/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Dudh",
        "type": "grocery",
        "quantity": "1",
        "unit": "litre",
        "price": "25"
    }, {
        "id": "198",
        "date": "02/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Makhon",
        "type": "grocery",
        "quantity": "3",
        "unit": "kg",
        "price": "42"
    }, {
        "id": "145",
        "date": "03/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Patol",
        "type": "vegetable",
        "quantity": "0.25",
        "unit": "kg",
        "price": "36"
    }, {
        "id": "172",
        "date": "01/01/23",
        "desc": "fhjkf sdfhsdhfjkhsdf sdhfsdkjfsjkd fks fjk sdf s f djks fshjkfhdsjkfhs kf sf",
        "title": "Patol",
        "type": "vegetable",
        "quantity": "3",
        "unit": "kg",
        "price": "10"
    }];
    dbData = _.chain(dbData).orderBy(['title', 'date'], ['asc', 'desc']).reduce(function(memo, obj) {
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
});

router.post('/api/add-purchase-item', function (req, res) {
    console.log(req.body);
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

module.exports = router;