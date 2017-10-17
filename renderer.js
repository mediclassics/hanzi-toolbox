// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = nodeRequire('electron')

angular.module("hanzitn", ['ngSanitize'])

.factory('Tools', function(){

	/*
	function send( functionName, req, func ){
		ipcRenderer.on( functionName + '-reply', func)
		ipcRenderer.send( functionName, req)
	}
	*/

	function send( functionName, req ){
		return ipcRenderer.sendSync( functionName, req)
	}

	return {
		"send": send
	}


})

.factory('Board', function(){

	var lastest = ['test1', 'test2']

	function addRst( newrst ){
		lastest = newrst
	}

	function getLastRst(){
		return lastest
	}

  	return {
  		"addRst": addRst,
  		"getLastRst": getLastRst
	};
})

.controller("duplicationsMergeCtrl", function ($scope, Board, Tools) {

	$scope.rawTextdup = "[예시]\n不(U+F967) → 不(U+4E0D)\n更(U+F901) → 更(U+66F4)\n里(U+F9E9) → 里(U+91CC)\n六(U+F9D1) → 六(U+516D)"

	$scope.mergeDuplications = function(){

		// console.log(reqUrl)
		var data = Tools.send( 'duplications', {text: $scope.rawTextdup} )

		$scope.mergedTextdup = data.output;
		Board.addRst( [$scope.rawTextdup, $scope.mergedTextdup] )

	}

})

.controller("variantsMergeCtrl", function ($scope, Board, Tools) {

	$scope.rawTextvar = "[예시]\n尚(U+5C1A) → 尙(U+5C19)\n為(U+70BA) → 爲(U+7232)\n垒(U+5792) → 壘(U+58D8)\n胆(U+80C6) → 膽(U+81BD)"

	$scope.tntype = $scope.tntype || "general"
	$scope.mergeVariants = function(){
		console.log($scope.tntype )
		// var reqUrl = ($scope.tntype==='general')? api.rooturl + 'tn/' + 'variants' : api.rooturl + 'tn/' + 'variants?extention=true'  // '?text=' + encodeURIComponent($scope.rawTextvar)
		// console.log(reqUrl)
		var data = Tools.send( 'variants', {text: $scope.rawTextvar} )
		$scope.mergedTextvar = data.output;
		Board.addRst( [$scope.rawTextvar, $scope.mergedTextvar] )
	}

})

.controller("replaceCtrl", function ($scope, Board, Tools) {

	$scope.bf = "\\s"
	$scope.af = ""
	$scope.replaceAll = function(){
		var rgxBf = new RegExp($scope.bf, "gi")
		// var rgxAf = new RegExp($scope.bf, "gi")
		var rgxAf = $scope.af
		$scope.mergedText = $scope.rawText.replace(rgxBf, rgxAf)
	}

	$scope.clone = function(){
		$scope.rawText = Board.getLastRst()[1]
	}

})

.controller("diffCtrl", function ($scope, Board, Tools) {

	$scope.diff = function(){
		var texts = Board.getLastRst()
		console.log( texts )

		var data = Tools.send( 'diff', {"text1": texts[0], "text2": texts[1]} )

		console.log(data)

		$scope.diffrst = data.output.html

	}

	$scope.reset = function(){
		$scope.diffrst = ""
	}

})


.controller("footerCtrl", function($scope){

	$scope.externalRefs = [
		{"name": "Unicode Character Code Charts",				"url": "http://www.unicode.org/charts/"},
		{"name": "유니코드한자검색시스템",		  "url": "http://www.kostma.net/segment/segmentList.aspx"},
		{"name": "유니코드한자검색기",		  "url": "http://db.koreanstudies.re.kr/"},
		{"name": "Dictionary|Ctext",				"url": "http://ctext.org/dictionary.pl?if=en"},
		{"name": "漢典",				"url": "http://www.zdic.net/"},
		{"name": "이체자정보검색|한국고전번역원",		  "url": "http://db.itkc.or.kr/DCH/index.jsp"},
		{"name": "고문서서체용례사전|한국학중앙연구원",		  "url": "http://www.kostma.net/segment/segmentList.aspx"},
		{"name": "漢典書法",				"url": "http://sf.zdic.net/"},
		{"name": "(敎育部)異體字字典",	"url": "http://dict2.variants.moe.edu.tw/variants/rbt/home.do"},
		{"name": "國際電腦漢字及異體字知識庫",	"url": "http://chardb.iis.sinica.edu.tw/"},
	]

	$scope.externalTools = [
		{"name": "Open Chinese Convert", 	"url": "https://github.com/BYVoid/OpenCC"},
		{"name": "Make Me a Hanzi", 	"url": "https://github.com/skishore/makemeahanzi"},
		{"name": "HanziJS", 	"url": "https://github.com/nieldlr/Hanzi"},
		{"name": "Diff", 				"url": "https://neil.fraser.name/software/diff_match_patch/svn/trunk/demos/demo_diff.html"}
	]
})
