app.factory('dbData', function ($http) {

    var getPurchaseItemList = function(){
		var req = {
			method: 'GET',
			url: '/api/get-purchase-item',
			timeout: 20000
		};
		return $http(req);
	};

    return {
        getPurchaseItemList: getPurchaseItemList
    };
});