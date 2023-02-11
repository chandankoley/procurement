app.factory('dbData', function ($http) {

    var getPurchaseItemList = function(){
		var req = {
			method: 'GET',
			url: '/api/get-purchase-item',
			timeout: 20000
		};
		return $http(req);
	};

	var addPurchaseItem = function(params){
		var req = {
			method: 'POST',
			url: '/api/add-purchase-item',
			timeout: 20000,
			data: params
		};
		return $http(req);
	};

    return {
        getPurchaseItemList: getPurchaseItemList,
		addPurchaseItem: addPurchaseItem
    };
});