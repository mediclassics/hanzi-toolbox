//================================================
// custom modules
const fs = require('fs');
const path = require('path');
// const tn = require("modules/tn.js")()
const {ipcMain} = require('electron')

function tn_api(){

	var dicts = {}

	var dictnames = ["duplications", "customvariants", "customvariantsExtention", "variantsgroup", "variantsgroupExtention"]
	dictnames.forEach(function(e, i, a){
	    var prepend = "tn.dict."
	    dicts[e] = require("./dict/" + prepend + e + ".js");
	})

    var brackets = /\[([^\[\\]*?)(\[[^\[\\]+?\][^\[\\]*?)+([^\[\\]*?)\]/g
    var replaceFunc = function(m){
    	var inner = m.substring(1, m.length-1).replace(/[\[\]]/g, "")
    	return "[" + inner + "]"
    }

    dicts.flatten = function( searchword ){
        var lastword
        function removeBracket(word){
        	var removedWord = word.replace(brackets, replaceFunc)
        	if(word==removedWord){
        		lastword = word
        	} else {
        		removeBracket(removedWord)
        	}
        }
        removeBracket(searchword)
        return lastword
    }


    // https://mathiasbynens.be/notes/javascript-unicode
    //	word.split() => Array.from(word)  // ES 6
    //	word.split() => [...word] // spread operation

    dicts.mergeDup = function( word, dupDictMap ){
        // return word.split("").map( function(e){
        return [...word].map( function(e){
            var result = dupDictMap[e] || [e]
            return result[0]
        }).join("")
    }



    dicts.gsubs = function( text, arr ){  // arr = [['a', 'a1'], ['b', 'b1'], ... ]
        var textClone = "" + text
		arr.forEach(function(e, i, a) {
			var rx = new RegExp( e[0], 'g' )
			textClone = textClone.replace(rx, e[1])
		})
		return textClone
    }

    return dicts
}

const tn = tn_api();



//================================================
// functions
function newwordWithVariants(myword, option){
	var newword
	var dicts = ( option.extention==="true" )? tn.variantsgroupExtention : tn.variantsgroup

	if ( !option.enumerator || option.enumerator==="text" ){
		console.log("enumerator -> text")
		newword = myword.split("").map(function( chr ){
			return ( dicts.map[chr])? "[" + dicts.map[chr].join("") + "]" : chr
		}).join("")
	} else {
		console.log("enumerator -> dict")
		newword = "" + myword
		dicts.array.forEach(function(el, ix, arr) {
			var _rx = "[" + el.join("")  + "]"
			var rx = new RegExp( _rx, 'g' )
			newword = newword.replace(rx, _rx)
		})
	}
	return newword
}

// Route
//================================================
// tn
//================================================

ipcMain.on('variants_searchword', (event, req) => {

	if( !req.text ){
		// event.sender.send('variants_searchword_reply', {"status": "error", "message":"text is invalid"} )
		event.returnValue = {"status": "error", "message":"text is invalid"}
		return
	}
	var myword = req.text
	var newword = newwordWithVariants( myword, {enumerator: req.enumerator, extention: req.extention})
 // 	event.sender.send('variants_searchword_reply', {"status": "success", "input": myword, "output": tn.flatten(newword) } )
 	event.returnValue = {"status": "success", "input": myword, "output": tn.flatten(newword) }

})

/*
router.route('/variants/searchword')
.get(function(req, res) {	// ?enumerator=text
    if( !req.query.text ){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var myword = req.query.text
	var newword = newwordWithVariants( myword, {enumerator: req.query.enumerator, extention: req.query.extention})
	res.send({"status": "success", "input": myword, "output": tn.flatten(newword) })
})
.post(function(req, res, next) {	// ?enumerator=text
	if( !req.body.text ){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var myword = req.body.text
	var newword = newwordWithVariants( myword, {enumerator: req.query.enumerator, extention: req.query.extention})
	res.send({"status": "success", "input": myword, "output": tn.flatten(newword) })
})
*/

ipcMain.on('variants', (event, req) => {

	if( !req.text ){
		// event.sender.send('variants_reply', {"status": "error", "message":"text is invalid"} )
		event.returnValue = {"status": "error", "message":"text is invalid"}
		return
	}
	var _text = req.text
	var text = (req.mergeDup === "false")?
		_text : tn.mergeDup( _text, tn.duplications.map );  // default : 다중코드 병합
	var dicts = ( req.extention==="true" )?
		tn.customvariantsExtention : tn.customvariants;  // default : customvariants
	var mergedText = ( req.enumerator==="dicts" )?
		tn.gsubs( text, dicts.array )  : tn.mergeDup( text, dicts.map );	// default : text -> mergeDup

	// event.sender.send('variants_reply', {"status": "success", "input": text , "output": mergedText} )
	event.returnValue = {"status": "success", "input": text , "output": mergedText}
})


/*
router.route('/variants')
.get(function(req, res, next) {	// ?enumerator=text &extention=false &mergeDup=true

	if( !req.query.text ){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var _text = req.query.text
	var text = (req.query.mergeDup === "false")?
		_text : tn.mergeDup( _text, tn.duplications.map );  // default : 다중코드 병합
	var dicts = ( req.query.extention==="true" )?
		tn.customvariantsExtention : tn.customvariants;  // default : customvariants

	var mergedText = ( req.query.enumerator==="dicts" )?
		tn.gsubs( text, dicts.array )  : tn.mergeDup( text, dicts.map );	// default : text -> mergeDup
	res.send({"status": "success", "input": text , "output": mergedText});
})
.post(function(req, res, next){  // text 양이 많을 때  	// ?enumerator=dicts &extention=false &mergeDup=true

	if( !req.body.text ){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var _text = req.body.text
	var text = (req.query.mergeDup === "false")?
		_text : tn.gsubs( _text, tn.duplications.array );  // default : 다중코드 병합
	var dicts = ( req.query.extention==="true" )?
		tn.customvariantsExtention : tn.customvariants;  // default : customvariants

	var mergedText = ( req.query.enumerator==="text" )?
		tn.mergeDup( text, dicts.map ) : tn.gsubs( text, dicts.array );  // default : dicts -> gsub
	res.send({"status": "success", "input": text , "output": mergedText});
})
*/

ipcMain.on('duplications', (event, req) => {

	if( !req.text){
		// event.sender.send('duplications_reply', {"status": "error", "message":"text is invalid"} )
		event.returnValue = {"status": "error", "message":"text is invalid"}
		return
	}
	var text = req.text
	var mergedText = ( req.enumerator==="dicts" )?
		tn.gsubs( text, tn.duplications.array )  : tn.mergeDup(text, tn.duplications.map )	// default : text -> mergeDup

	// event.sender.send('duplications_reply', {"status": "success", "input": text , "output": mergedText} )
	event.returnValue = {"status": "success", "input": text , "output": mergedText}
})

/*
router.route('/duplications')
.get(function(req, res, next) {	// ?enumerator=text
	if( !req.query.text){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var text = req.query.text
	var mergedText = ( req.query.enumerator==="dicts" )?
		tn.gsubs( text, tn.duplications.array )  : tn.mergeDup(text, tn.duplications.map )	// default : text -> mergeDup
	res.send({"status": "success", "input": text , "output": mergedText})
})
.post(function(req, res, next){	// ?enumerator=dicts   // text 양이 많을 때
	if( !req.body.text){ return res.send({"status": "error", "message":"text is invalid"}).end() }
	var text = req.body.text
	var mergedText = ( req.query.enumerator==="text" )?
		tn.mergeDup(text, tn.duplications.map ) : tn.gsubs( text, tn.duplications.array )  // default : dicts -> gsub
	res.send({"status": "success", "input": text , "output": mergedText})
})
*/

/*
router.get('/dict/:dictname', function(req, res, next) {

	var _filename = req.params.dictname + ".tsv"
	var filename = path.join(__dirname, '..', 'custom_modules', 'tn', 'dict', 'source', 'custom', _filename)
	var dictData = tn[ req.params.dictname ]

	if(!dictData){ return 	res.end( "There is no data!" ); }

	switch( req.query.type ) {
	case "download":	// file로 다운로드

		res.download(filename, function (err) {
			if (err) {
			  console.log(err);
			  res.status(err.status).end();
			}
			else {
			  console.log('Sent:', filename);
			}
		});
		break;

	case "raw":	// file 내용 tsv 형태로  browser에 표시

		fs.readFile(filename, 'utf8', function(err, data) {
			if (err) {
			  console.log(err);
			  res.status(err.status).end();
			}
			res.set('Content-Type', 'text/html')
			res.send( "<pre>" + data + "</pre>" )
		});
		break;

	case "tsv":

		var tsvData = dictData.array.map(function( e ){
			return e.join("\t")
		}).join("\n")
		res.set('Content-Type', 'text/html')
		res.send( "<pre>" + tsvData + "</pre>")
		break;

	default:

		if( req.query.type==="map" || req.query.type==="hash" ){
			res.send( dictData.map )
		} else {
			res.send( dictData.array )
		}

	}
})
*/
