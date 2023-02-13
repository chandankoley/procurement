app.factory('dbData', function ($http) {

    var getPurchaseItemList = function(params){
		var req = {
			method: 'POST',
			url: '/api/get-purchase-item',
			timeout: 20000,
			data: params
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

	var deletePurchaseItem = function(params){
		var req = {
			method: 'POST',
			url: '/api/delete-purchase-item',
			timeout: 20000,
			data: params
		};
		return $http(req);
	};

	var getWishItemList = function(){
		var req = {
			method: 'GET',
			url: '/api/get-wish-item',
			timeout: 20000
		};
		return $http(req);
	};

	var addWishItem = function(params){
		var req = {
			method: 'POST',
			url: '/api/add-wish-item',
			timeout: 20000,
			data: params
		};
		return $http(req);
	};

	var deleteWishItem = function(params){
		var req = {
			method: 'POST',
			url: '/api/delete-wish-item',
			timeout: 20000,
			data: params
		};
		return $http(req);
	};

	var updateWishImportantFlag = function(params){
		var req = {
			method: 'GET',
			url: '/api/update-wish-item-important-flag?id=' + params.id + '&isImportant=' + params.isImportant,
			timeout: 20000,
			data: params
		};
		return $http(req);
	};

	var getDistinctPurchaseItem = function(){
		var req = {
			method: 'GET',
			url: '/api/get-distinct-purchase-item',
			timeout: 20000
		};
		return $http(req);
	};

    return {
        getPurchaseItemList: getPurchaseItemList,
		addPurchaseItem: addPurchaseItem,
		deletePurchaseItem: deletePurchaseItem,
		getWishItemList: getWishItemList,
		addWishItem: addWishItem,
		deleteWishItem: deleteWishItem,
		updateWishImportantFlag: updateWishImportantFlag,
		getDistinctPurchaseItem: getDistinctPurchaseItem
    };
});