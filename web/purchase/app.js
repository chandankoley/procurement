var app = angular.module('purchaseApp', []);

app.controller('purchaseController', function ($scope, $timeout, dbData) {

    $scope.page = {
        open: "wishlist",
        wishlist: {},
        purchaselist: {
            search: {
                titleStr: '',
                findPurchasedItems: function() {
                    var params = {
                        titleStr: this.titleStr.toLowerCase()
                    };
                    $scope.page.purchaselist.searchSummary = 'Searching your item. Please wait...';
                    dbData.getPurchaseItemList(params).then(function(res){
                        $scope.page.purchaselist.data = res.data;
                        $scope.page.purchaselist.searchSummary = 'Found ' + res.data.length + ' items according to your search filter' ;
                    }).catch(function(e){
                        console.error(e);
                        $scope.alertHandler.triggerAlert('Search failed due to server issue', 5);
                    });
                }
            },
            searchSummary: '',
            data: null
        }
    };

    $scope.getUnitPrice = function (unit, quantity, price) {
        return (price/quantity).toFixed(2) + "/" + unit;
    };

    $scope.newItemDialog = {
        id: "",
        title: "",
        desc: "",
        date: "",
        type: "grocery",
        quantity: 0,
        unit: "pc",
        price: 0,
        formOptions: {
            itemType: {
                list: [
                    {id: "grocery", value: "Grocery"},
                    {id: "vegetable", value: "Vegetable"},
                    {id: "fruit", value: "Fruit"},
                    {id: "furniture", value: "Furniture"},
                    {id: "others", value: "Others"}
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
                addNewWish: false,
                editPurchase: false,
                editWish: false
            }
        },
        loadItemDetailsDialog: function (itemObj, action) {
            if(action === 'new-purchase-wishlist') {
                this.id = 'ITEM_' + moment().format('x');
                this.title = '';
                this.desc = '';
                this.date = moment().format('DD-MM-YY');
                this.type = this.formOptions.itemType.list[0].id;
                this.quantity = 1;
                this.unit = this.formOptions.itemUnit.list[0].id;
                this.price = 100;
                this.formOptions.isButtonVisible.addNewPurchase = true;
                this.formOptions.isButtonVisible.addNewWish = true;
                this.formOptions.isButtonVisible.editPurchase = false;
                this.formOptions.isButtonVisible.editWish = false;
            } else if(action === 'edit-purchase') {
                this.id = itemObj.id;
                this.title = itemObj.title;
                this.desc = itemObj.desc;
                this.date = itemObj.date;
                this.type = itemObj.type;
                this.quantity = parseFloat(itemObj.quantity);
                this.unit = itemObj.unit;
                this.price = parseInt(itemObj.price);
                this.formOptions.isButtonVisible.addNewPurchase = true;
                this.formOptions.isButtonVisible.addNewWish = true;
                this.formOptions.isButtonVisible.editPurchase = true;
                this.formOptions.isButtonVisible.editWish = false;
            } else if(action === 'edit-wishlist') {
                this.id = itemObj.id;
                this.title = itemObj.title;
                this.desc = itemObj.desc;
                this.date = itemObj.date;
                this.type = itemObj.type;
                this.quantity = parseFloat(itemObj.quantity);
                this.unit = itemObj.unit;
                this.price = parseInt(itemObj.price);
                this.formOptions.isButtonVisible.addNewPurchase = true;
                this.formOptions.isButtonVisible.addNewWish = true;
                this.formOptions.isButtonVisible.editPurchase = false;
                this.formOptions.isButtonVisible.editWish = true;
            } else {
                /*Invalid action*/
            }
        },
        validateData: function() {
            var result = {
                isValid: true,
                reason: ''
            };
            if(this.title === '') {
                result.isValid = false;
                result.reason = 'Please provide product title'
            } else if(!moment(this.date, 'DD-MM-YYYY').isValid()) {
                result.isValid = false;
                result.reason = 'Please date in DD/MM/YYYY format'
            } else if(this.quantity == null || parseFloat(this.quantity) <= 0) {
                result.isValid = false;
                result.reason = 'Please provide valid quantity'
            } else if(this.quantity == null || parseFloat(this.price) <= 0) {
                result.isValid = false;
                result.reason = 'Please provide valid price'
            } 
            return result;
        },
        addPurchaseItem: function() {
            var validCheck = this.validateData();
            if(validCheck.isValid) {
                var params = {
                    id: 'ITEM_' + moment().format('x'),
                    title: this.title,
                    desc: this.desc,
                    date: moment(this.date, 'DD/MM/YYYY').format('YYYYMMDD'),
                    type: this.type,
                    quantity: this.quantity,
                    unit: this.unit,
                    price: this.price
                }
                dbData.addPurchaseItem(params).then(function(){
                    $scope.alertHandler.triggerAlert('New purchased Item added successfully', 5);
                    $scope.page.purchaselist.search.findPurchasedItems();
                }).catch(function(e){
                    console.error("Item failed to add::", e);
                    $scope.alertHandler.triggerAlert('Failed to add purchased Item', 5);
                });
            } else {
                $scope.alertHandler.triggerAlert(validCheck.reason, 5);
            }
        },
        updatePurchaseItem: function() {
            var validCheck = this.validateData();
            if(validCheck.isValid) {
                var params = {
                    id: this.id,
                    title: this.title,
                    desc: this.desc,
                    date: moment(this.date, 'DD/MM/YYYY').format('YYYYMMDD'),
                    type: this.type,
                    quantity: this.quantity,
                    unit: this.unit,
                    price: this.price
                }
                dbData.deletePurchaseItem({id: params.id}).then(function(){
                    return dbData.addPurchaseItem(params);
                }).then(function(){
                    $scope.alertHandler.triggerAlert('Purchased Item updated successfully', 5);
                    $scope.page.purchaselist.search.findPurchasedItems();
                }).catch(function(e){
                    console.error("Item failed to update::", e);
                    $scope.alertHandler.triggerAlert('Failed to update purchased Item', 5);
                });
            } else {
                $scope.alertHandler.triggerAlert(validCheck.reason, 5);
            }
        }
    };

    $scope.onItemDelete = function(itemObj, target) {
        if(target === 'purchase'){
            $scope.confirmHandler.message = "Are you sure to delete '" + itemObj.title + "' purchased on " + itemObj.date + " ?";
            $scope.confirmHandler.showConfirm = true;
            $scope.confirmHandler.onConfirm = function() {
                console.log("delete purchase::", itemObj, target);
                $scope.confirmHandler.showConfirm = false;
                dbData.deletePurchaseItem({id: itemObj.id}).then(function(){
                    $scope.alertHandler.triggerAlert('Item deleted successfully', 5);
                    $scope.page.purchaselist.search.findPurchasedItems();
                }).catch(function(e){
                    console.error("Item failed to delete::", e);
                    $scope.alertHandler.triggerAlert('Failed to delete purchased Item', 5);
                });
            }
        } else if(target === 'wish'){
            $scope.confirmHandler.message = "Are you sure to delete '" + itemObj.title + "' from wishlist?";
            $scope.confirmHandler.showConfirm = true;
            $scope.confirmHandler.onConfirm = function() {
                console.log("delete wish::", itemObj, target);
                $scope.confirmHandler.showConfirm = false;
            }
        } else {
            console.log('Invalid operation');
        }
    };

    $scope.alertHandler = {
        showAlert: false,
        message: '',
        triggerAlert: function(message, showtime) {
            this.message = message;
            this.showAlert = true;
            var _this = this;
            $timeout(function() {
                _this.showAlert = false;
            }, showtime * 1000);
        }
    };

    $scope.confirmHandler = {
        showConfirm: false,
        message: '',
        onConfirm: function() {
            console.log("Override this method to do something...");
        }
    }
});