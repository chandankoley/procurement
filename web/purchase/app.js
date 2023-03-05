var app = angular.module('purchaseApp', []);

app.controller('purchaseController', function ($scope, $timeout, $window, dbData) {

    var date = new Date();
    $scope.userInfo = {};
    $scope.page = {
        open: "wishlist",
        wishlist: {
            search: {
                findWishlistItems: function() {
                    $scope.page.wishlist.searchSummary = 'Searching your wish. Please wait...';
                    dbData.getWishItemList().then(function(res){
                        $scope.page.wishlist.data = res.data;
                        if($scope.page.wishlist.data.length > 0) {
                            $scope.page.wishlist.searchSummary = 'Found ' + _.reduce($scope.page.wishlist.data, function(memo, itemObj){
                                memo += itemObj.details.length;
                                return memo;
                            }, 0) + ' items in your wishlist.'
                        } else {
                            $scope.page.wishlist.searchSummary = 'Looking like your Wishlist is Empty' ;
                        }
                    }).catch(function(e){
                        console.error(e);
                        $scope.page.wishlist.searchSummary = '';
                        $scope.alertHandler.triggerAlert('Search failed due to server issue', 5);
                        $scope.validateSession('api-error', e);
                    });
                }
            },
            searchSummary: '',
            data: [],
            dataTypeVisibilityMap: {},
            toggleVisibility: function(info) {
                if(info.type === 'type-1') {
                    var visibility = $scope.page.wishlist.dataTypeVisibilityMap[info.key];
                    $scope.page.wishlist.dataTypeVisibilityMap[info.key] = visibility ? !visibility : true;
                }
            }
        },
        purchaselist: {
            search: {
                timeout: null,
                titleStr: '',
                titleTypeaheadList: [],
                titleTypeaheadSearchedItems: [],
                updateTypeaheadList: function() {
                    dbData.getDistinctPurchaseItem().then(function(searchList) {
                        $scope.page.purchaselist.search.titleTypeaheadList = searchList.data;
                    }).catch(function(e){
                        console.error("failed to load typeahead::", e);
                        $scope.validateSession('api-error', e);
                    });
                },
                updatetitleTypeaheadSearchedItems: function() {
                    var _this = this;
                    if(_this.titleStr !== '') {
                        clearTimeout(this.timeout);
                        this.timeout = setTimeout(function() {
                            $scope.page.purchaselist.search.titleTypeaheadSearchedItems = _.reduce(_this.titleTypeaheadList, function(memo, item){
                                if(item.toLowerCase().indexOf(_this.titleStr.toLowerCase()) >= 0 && memo.length <= 10) {
                                    memo.push(item);
                                }
                                return memo;
                            }, []);
                            $scope.$apply();
                        }, 500);
                    } else {
                        $scope.page.purchaselist.search.titleTypeaheadSearchedItems = [];
                    }
                },
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
                findPurchasedItems: function(filter) {
                    var params = {
                        titleStr: this.titleStr.toLowerCase(),
                        titleStrStrict: filter && filter.titleStrStrict === true,
                        sdt: moment(this.timeRange.sdt, 'YYYY-MM-DD').format('YYYYMMDD'),
                        edt: moment(this.timeRange.edt, 'YYYY-MM-DD').format('YYYYMMDD')
                    };
                    $scope.page.purchaselist.searchSummary = 'Searching your item. Please wait...';
                    dbData.getPurchaseItemList(params).then(function(res){
                        $scope.page.purchaselist.data = res.data;
                        $scope.page.purchaselist.searchSummary = 'Found ' + res.data.length + ' items according to your search filter' ;
                    }).catch(function(e){
                        console.error(e);
                        $scope.page.purchaselist.searchSummary = '';
                        $scope.alertHandler.triggerAlert('Search failed due to server issue', 5);
                        $scope.validateSession('api-error', e);
                    });
                }
            },
            searchSummary: '',
            data: []
        },
        report: {
            search: {
                endDate: new Date(),
                startDate: new Date(date.setDate(date.getDate() - 7)),
                groupOption: {
                    selected: 'date',
                    list: [
                        {id: "date", value: "Group by Date"},
                        {id: "type", value: "Group by Type"},
                        {id: "title", value: "Group by Product"}
                    ]
                },
                findPurchasedItems: function() {
                    var _this = this;
                    var params = {
                        sdt: moment(_this.startDate).format('YYYYMMDD'),
                        edt: moment(_this.endDate).format('YYYYMMDD')
                    };
                    $scope.page.report.data.searchSummary = "Generating your report, Please wait...";
                    dbData.getPurchaseItemList(params).then(function(res){
                        $scope.page.report.data.searchSummary = "Found " + res.data.length + " items according to your search";
                        $scope.page.report.data.searchInfo.query = "Expense details of " +  moment(_this.startDate).format('DD MMM\'YY') + " to " + moment(_this.endDate).format('DD MMM\'YY');
                        $scope.page.report.data.searchInfo.data = res.data;
                        _this.formatReport();
                    }).catch(function(e){
                        console.error(e);
                        $scope.page.report.data.searchSummary = "Failed to Generate your report";
                        $scope.alertHandler.triggerAlert('Search failed due to server issue', 5);
                        $scope.validateSession('api-error', e);
                    });
                },
                formatReport: function() {
                    var _this = this;
                    $scope.page.report.data.tableInfo = _.chain($scope.page.report.data.searchInfo.data).reduce(function(memo, item){
                        memo = memo.concat(item.details);
                        return memo;
                    }, []).groupBy(_this.groupOption.selected).reduce(function(memo, list, key){
                        var obj = {
                            group: _this.groupOption.selected === 'type' ? key.charAt(0).toUpperCase() + key.slice(1) : key,
                            groupSortId: _this.groupOption.selected === 'date' ? moment(key, 'DD-MM-YYYY').format('YYYYMMDD') : key,
                            total: _.chain(list).pluck('price').sum().value(),
                            items: list
                        };
                        memo.total += obj.total;
                        memo.list.push(obj);
                        memo.list = _.sortBy(memo.list, 'groupSortId');
                        return memo;
                    }, {query: $scope.page.report.data.searchInfo.query, total: 0, list: []}).value();
                    console.log("report::", $scope.page.report.data.tableInfo);
                }
            },
            data: {
                searchSummary: '',
                searchInfo: {
                    query: "",
                    data: []
                },
                tableInfo: {}
            },
            toggleVisibility: function(info) {
                if(info.type === 'type-1') {
                    var visibility = $scope.page.report.data.tableInfo.list[info.groupIndex].items[info.itemIndex].visible;
                    $scope.page.report.data.tableInfo.list[info.groupIndex].items[info.itemIndex].visible = visibility ? !visibility : true;
                } else if(info.type === 'type-2') {
                    var visibility = $scope.page.report.data.tableInfo.list[info.groupIndex].visible;
                    $scope.page.report.data.tableInfo.list[info.groupIndex].visible = visibility ? !visibility : true;
                }
            }
        }
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
                    {id: "automobile", value: "Automobile"},
                    {id: "entertainment", value: "Entertainment"},
                    {id: "others", value: "Others"}
                ]
            },
            itemUnit: {
                list: [
                    {id: "pc", value: "Piece"},
                    {id: "kg", value: "Kg"},
                    {id: "litre", value: "Litre"},
                    {id: "NA", value: "NA"}
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
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
                    $scope.validateSession('api-error', e);
                });
            }
        } else {
            console.log('Invalid operation');
        }
    };

    $scope.onWishItemClickHandler = {
        processFlag: true,
        silentSingleClick: function() {
            $scope.onWishItemClickHandler.processFlag = false;
            $timeout(function() {
                $scope.onWishItemClickHandler.processFlag = true;
            }, 1000);
        },
        singleClick: function(itemObj) {
            $timeout(function() {
                if($scope.onWishItemClickHandler.processFlag === true) {
                    var isImportant = itemObj.important && itemObj.important === 'true' ? 'false' : 'true'
                    dbData.updateWishImportantFlag({id: itemObj.id, isImportant: isImportant}).then(function(){
                        $scope.page.wishlist.search.findWishlistItems();
                    }).catch(function(e){
                        console.error("Item failed to delete::", e);
                        $scope.alertHandler.triggerAlert('Failed to update importance of wish item', 5);
                        $scope.validateSession('api-error', e);
                    });
                }
            }, 500);
        },
        doubleClick: function(title) {
            $scope.onWishItemClickHandler.silentSingleClick();
            $scope.page.purchaselist.search.titleStr = title;
            $scope.page.purchaselist.search.timeRange.selectedTime = "3-M";
            $scope.page.open = "purchase";
            $scope.page.purchaselist.search.findPurchasedItems({titleStrStrict: true});
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

    $scope.formatDate = function(dateStr, dateInputFormat, dateOutputFormat) {
        return moment(dateStr, dateInputFormat).format(dateOutputFormat);
    };

    $scope.getUnitPrice = function (unit, quantity, price) {
        return $scope.toIndianCurrency(price/quantity) + "/" + unit;
    };

    $scope.toIndianCurrency = function(num) {
        return num.toLocaleString('en-IN', {
           style: 'currency',
           currency: 'INR'
        });
    };

    $scope.validateSession = function(target, error) {
        if(target === 'app-load') {
            dbData.isValidSession().then(function(res) {
                $scope.userInfo = res.data;
                $scope.userInfo['first_name'] = _.chain($scope.userInfo.name).split(" ").head().value();
                $scope.page.wishlist.search.findWishlistItems();
                $scope.page.purchaselist.search.findPurchasedItems();
                $scope.page.purchaselist.search.updateTypeaheadList();
            }).catch(function(e){
                if(e.status === 401) {
                    $window.open("/login", "_parent");
                } else {
                    $scope.alertHandler.triggerAlert('Internal server error', 5);
                }
            });
        } else if(target === 'api-error') {
            if(error.status === 401) {
                $window.open("/login", "_parent");
            }
        } else {
            console.log("Invalid argument passed in validate session");
        }
    };

    $scope.goToProfile = function() {
        $window.open("/login", "_parent");
    };
    
    //onload calls
    $scope.validateSession('app-load');
    
});