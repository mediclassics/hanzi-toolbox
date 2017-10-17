// custom modules
const path = require('path');

const {ipcMain} = require('electron')

var DiffMatchPatch = require('diff-match-patch');
var dmp = new DiffMatchPatch();
//use the methods that dmp has
//see: https://code.google.com/p/google-diff-match-patch/wiki/API

//You can also use the following properties:

DiffMatchPatch.DIFF_DELETE = -1;
DiffMatchPatch.DIFF_INSERT = 1;
DiffMatchPatch.DIFF_EQUAL = 0;

//================================================
// functions

ipcMain.on('diff', (event, req) => {

	console.log( req )

	if( !req.text1 ){
		event.sender.send('diff_reply', {"status": "error", "message":"text1 is invalid"})
		return
	}

	if( !req.text2 ){
		event.sender.send('diff_reply', {"status": "error", "message":"text2 is invalid"})
		return
	}

	var df = dmp.diff_main( req.text1, req.text2 )
	dmp.diff_cleanupSemantic( df )
	// https://code.google.com/archive/p/google-diff-match-patch/wikis/API.wiki

	var rst = {
		"raw" : dmp.diff_main( req.text1, req.text2 ),   // array
		"cleanup" : df,  // array
		"html" : dmp.diff_prettyHtml( df ) // html
	}

	event.returnValue = {"status": "success", "output": rst }

})
