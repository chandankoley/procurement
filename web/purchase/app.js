var app = angular.module('purchaseApp', []);

app.controller('purchaseController', function ($scope, dbData) {
    /*$scope.purchaseList = [];
    $scope.searchItem = '';

    $scope.getGroupItemList = function () {
        dbData.getItemsInterDate().then(function (items) {
            console.log(items);
            //$scope.purchaseList = items;
            //$scope.$apply();
        });
    };
    $scope.getItemList();*/

    $scope.page = {
        open: "wishlist",
        wishlist: {},
        purchaselist: {
            data: null
        }
    };

    $scope.getUnitPrice = function (unit, quantity, price) {
        return (price/quantity).toFixed(2) + "/" + unit;
    };

    $scope.newItemDialog = {
        id: "",
        title: "",
        date: "",
        type: "grocery",
        quantity: "",
        unit: "pc",
        price: 0,
        formOptions: {
            itemType: {
                list: [
                    {id: "grocery", value: "Grocery"},
                    {id: "vegetable", value: "Vegetable"},
                    {id: "fruit", value: "Fruit"}
                ]
            },
            itemUnit: {
                list: [
                    {id: "pc", value: "Piece"},
                    {id: "kg", value: "Kg"},
                    {id: "litre", value: "Litre"}
                ]
            },
            isButtonVisible: {
                addNewPurchase: false,
                editPurchase: false,
                addNewWish: false,
                editWish: false
            }
        },
        saveItem: function (savePurchasedItem) {
            console.log("savePurchasedItem::", savePurchasedItem);
        },
        editItem: function (itemObj, action) {
            console.log(itemObj, action);
            this.id = itemObj.id;
            this.title = itemObj.title;
            this.date = itemObj.date;
            this.type = itemObj.type;
            this.quantity = parseFloat(itemObj.quantity);
            this.unit = itemObj.unit;
            this.price = parseInt(itemObj.price);
            if(action === 'edit-purchase') {
                /*Do Something*/
            }
        }
    };

    dbData.getPurchaseItemList().then(function(res){
        console.log("purchaseList::", res.data);
        $scope.page.purchaselist.data = res.data;
    });
});