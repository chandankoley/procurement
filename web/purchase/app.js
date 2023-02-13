var app = angular.module('purchaseApp', []);

app.controller('purchaseController', function ($scope, $timeout, dbData) {

    $scope.page = {
        open: "purchase",
        wishlist: {
            search: {
                findWishlistItems: function() {
                    $scope.page.wishlist.searchSummary = 'Searching your wish. Please wait...';
                    dbData.getWishItemList().then(function(res){
                        $scope.page.wishlist.data = res.data;
                        $scope.page.wishlist.searchSummary = '' ;
                    }).catch(function(e){
                        console.error(e);
                        $scope.alertHandler.triggerAlert('Search failed due to server issue', 5);
                    });
                }
            },
            searchSummary: '',
            data: []
        },
        purchaselist: {
            search: {
                titleStr: '',
                timeRange: {
                    sdt: moment().subtract(1, 'months').format('YYYY-MM-DD'),
                    edt: moment().format('YYYY-MM-DD'),
                    selectedTime: "1-M",
                    list: [
                        {id: "1-M", value: "Last 1 Month"},
                        {id: "15-D", value: "Last 15 Days"},
                        {id: "7-D", value: "Last 7 Days"},
                        {id: "TD", value: "Today"},
                        {id: "2-M", value: "Last 2 Months"},
                        {id: "3-M", value: "Last Quarter"},
                        {id: "6-M", value: "Last Half Year"},
                        {id: "12-M", value: "Last Year"}
                    ],
                    onTimeRangeChange: function() {
                        if (this.selectedTime === 'TD') {
                            this.sdt = this.edt;
                        } else {
                            var td = this.selectedTime.split('-');
                            if(td[1] === 'D') {
                                this.sdt = moment().subtract(parseInt(td[0]), 'days').format('YYYY-MM-DD');
                            } else if(td[1] === 'M') {
                                this.sdt = moment().subtract(parseInt(td[0]), 'months').format('YYYY-MM-DD');
                            } else {
                                this.sdt = moment().subtract(12, 'months').format('YYYY-MM-DD');
                            }
                        }
                    }
                },
                findPurchasedItems: function() {
                    var params = {
                        titleStr: this.titleStr.toLowerCase(),
                        sdt: moment(this.timeRange.sdt, 'YYYY-MM-DD').format('YYYYMMDD'),
                        edt: moment(this.timeRange.edt, 'YYYY-MM-DD').format('YYYYMMDD')
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
            data: []
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
                    {id: "kitchenware", value: "Kitchenware"},
                    {id: "non-veg", value: "Non-veg"},
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
                editWish: false,
                moveWishToPurchase: false
            }
        },
        loadItemDetailsDialog: function (itemObj, action) {
            if(action === 'new-purchase-wishlist') {
                this.id = 'ITEM_' + moment().format('x');
                this.title = '';
                this.desc = '';
                this.date = moment().format('DD/MM/YYYY');
                //this.type = this.formOptions.itemType.list[0].id;  keeping last type as default
                this.quantity = 1;
                this.unit = this.formOptions.itemUnit.list[0].id;
                this.price = 100;
                this.formOptions.isButtonVisible.addNewPurchase = true;
                this.formOptions.isButtonVisible.addNewWish = true;
                this.formOptions.isButtonVisible.editPurchase = false;
                this.formOptions.isButtonVisible.editWish = false;
                this.formOptions.isButtonVisible.moveWishToPurchase = false;
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
                this.formOptions.isButtonVisible.moveWishToPurchase = false;
            } else if(action === 'edit-wishlist') {
                this.id = itemObj.id;
                this.title = itemObj.title;
                this.desc = itemObj.desc;
                this.date = moment().format('DD/MM/YYYY');
                this.type = itemObj.type;
                this.important = itemObj.important;
                this.formOptions.isButtonVisible.addNewPurchase = false;
                this.formOptions.isButtonVisible.addNewWish = false;
                this.formOptions.isButtonVisible.editPurchase = false;
                this.formOptions.isButtonVisible.editWish = true;
                this.formOptions.isButtonVisible.moveWishToPurchase = true;
            } else {
                /*Invalid action*/
            }
        },
        validateData: function(validItem) {
            var result = {
                isValid: true,
                reason: ''
            };
            if(_.indexOf(validItem, 'title') >= 0 && (this.title == '' || this.title == null)) {
                result.isValid = false;
                result.reason = 'Please provide product title'
            } else if(_.indexOf(validItem, 'date') >= 0 && !moment(this.date, 'DD-MM-YYYY').isValid()) {
                result.isValid = false;
                result.reason = 'Please date in DD/MM/YYYY format'
            } else if(_.indexOf(validItem, 'quantity') >= 0 && (this.quantity == null || parseFloat(this.quantity) <= 0)) {
                result.isValid = false;
                result.reason = 'Please provide valid quantity'
            } else if(_.indexOf(validItem, 'price') >= 0 && (this.price == null || parseFloat(this.price) <= 0)) {
                result.isValid = false;
                result.reason = 'Please provide valid price'
            } else if(_.indexOf(validItem, 'type') >= 0 && (this.type == '' || this.type == null)) {
                result.isValid = false;
                result.reason = 'Please provide product type details'
            } else if(_.indexOf(validItem, 'unit') >= 0 && (this.unit === '' || this.unit == null)) {
                result.isValid = false;
                result.reason = 'Please provide product unit details'
            }
            return result;
        },
        addPurchaseItem: function() {
            var validCheck = this.validateData(['title', 'date', 'quantity', 'price', 'type', 'unit']);
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
                    $scope.alertHandler.triggerAlert('New Purchased Item added successfully', 5);
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
            var validCheck = this.validateData(['title', 'date', 'quantity', 'price', 'type', 'unit']);
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
                    $scope.alertHandler.triggerAlert('Failed to update purchased item', 5);
                });
            } else {
                $scope.alertHandler.triggerAlert(validCheck.reason, 5);
            }
        },
        addWishItem: function() {
            var validCheck = this.validateData(['title', 'type']);
            if(validCheck.isValid) {
                var params = {
                    id: 'ITEM_' + moment().format('x'),
                    title: this.title,
                    type: this.type,
                    desc: this.desc,
                    important: 'false'
                }
                dbData.addWishItem(params).then(function(){
                    $scope.alertHandler.triggerAlert('New Wish Item added successfully', 5);
                    $scope.page.wishlist.search.findWishlistItems();
                }).catch(function(e){
                    console.error("Item failed to add::", e);
                    $scope.alertHandler.triggerAlert('Failed to add wish item', 5);
                });
            } else {
                $scope.alertHandler.triggerAlert(validCheck.reason, 5);
            }
        },
        updateWishItem: function() {
            var validCheck = this.validateData(['title']);
            if(validCheck.isValid) {
                var params = {
                    id: this.id,
                    title: this.title,
                    type: this.type,
                    desc: this.desc,
                    important: 'false'
                }
                dbData.deleteWishItem({id: params.id}).then(function(){
                    return dbData.addWishItem(params);
                }).then(function(){
                    $scope.alertHandler.triggerAlert('Wish Item updated successfully', 5);
                    $scope.page.wishlist.search.findWishlistItems();
                }).catch(function(e){
                    console.error("Item failed to update::", e);
                    $scope.alertHandler.triggerAlert('Failed to update wish item', 5);
                });
            } else {
                $scope.alertHandler.triggerAlert(validCheck.reason, 5);
            }
        },
        moveWishToPurchase: function() {
            var validCheck = this.validateData(['title', 'date', 'quantity', 'price', 'type', 'unit']);
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
                dbData.deleteWishItem({id: params.id}).then(function(){
                    return dbData.addPurchaseItem(params);
                }).then(function(){
                    $scope.alertHandler.triggerAlert('Removed Item from wishlist and add to Purchased Item successfully', 5);
                    $scope.page.purchaselist.search.findPurchasedItems();
                    $scope.page.wishlist.search.findWishlistItems();
                }).catch(function(e){
                    console.error("Item failed to update::", e);
                    $scope.alertHandler.triggerAlert('Failed to Remove Item from wishlist and add to Purchased Item', 5);
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
                    $scope.alertHandler.triggerAlert('Failed to delete purchased item', 5);
                });
            }
        } else if(target === 'wish'){
            $scope.confirmHandler.message = "Are you sure to delete '" + itemObj.title + "' from wishlist?";
            $scope.confirmHandler.showConfirm = true;
            $scope.confirmHandler.onConfirm = function() {
                console.log("delete wish::", itemObj, target);
                $scope.confirmHandler.showConfirm = false;
                dbData.deleteWishItem({id: itemObj.id}).then(function(){
                    $scope.alertHandler.triggerAlert('Item deleted successfully', 5);
                    $scope.page.wishlist.search.findWishlistItems();
                    $scope.page.purchaselist.search.findPurchasedItems();
                }).catch(function(e){
                    console.error("Item failed to delete::", e);
                    $scope.alertHandler.triggerAlert('Failed to delete wish item', 5);
                });
            }
        } else {
            console.log('Invalid operation');
        }
    };

    $scope.onItemImportant = function(itemObj) {
        var isImportant = itemObj.important && itemObj.important === 'true' ? 'false' : 'true'
        dbData.updateWishImportantFlag({id: itemObj.id, isImportant: isImportant}).then(function(){
            $scope.page.wishlist.search.findWishlistItems();
        }).catch(function(e){
            console.error("Item failed to delete::", e);
            $scope.alertHandler.triggerAlert('Failed to update importance of wish item', 5);
        });
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

    $scope.formatDate = function(dateStr, dateInputFormat, dateOutputFormat) {
        return moment(dateStr, dateInputFormat).format(dateOutputFormat);
    };

    var getDateRange = function() {

    };

    //onload calls
    $scope.page.wishlist.search.findWishlistItems();
    $scope.page.purchaselist.search.findPurchasedItems();
});