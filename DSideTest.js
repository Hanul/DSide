require(process.env.UPPERCASE_PATH + '/LOAD.js');

BOOT({
	CONFIG : {
		defaultBoxName : 'DSideTest',
		isDevMode : true,
		webServerPort : 8225
	},
	
	BROWSER_CONFIG : {
		isNotConnectToServer : true
	},
	
	NODE_CONFIG : {
		// CPU 클러스터링 기능을 사용하지 않습니다.
		isNotUsingCPUClustering : true
	}
});