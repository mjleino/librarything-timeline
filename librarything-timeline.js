// librarything api documentation: http://www.librarything.com/wiki/index.php/LibraryThing_JSON_Books_API
// beware! it's a bit out of date :--/

function jsonifyBooks() {
	var books = [];
	for (bookId in widgetResults.books) {
		books.push(widgetResults.books[bookId]);
	}
	console.log(books);
	books.sort(byFinishedAscending);
	
	if (books.length == 0) return; // TODO: some error msg?

	// see: http://timeline.verite.co/#fileformat
	var booksJSON = {
		"timeline": {
			"headline": 	params.userid+"'s LibraryThing Timeline",
			"type":    		"default",
			"startDate": 	timelineDate(books[0].startfinishdates[0].started_stamp),
			"text": 		"There's " + books.length + " books on your timeline.",
			/*"asset": {
				"media": 	"",
				"credit": 	"",
				"caption": 	""
			},*/
			"date": 		[]  
		}
	};

	for (var i = 0; i < books.length; i++) {
		booksJSON.timeline.date.push({
			"startDate": 	timelineDate(books[i].startfinishdates[0].started_stamp),
			"endDate": 		timelineDate(books[i].startfinishdates[0].finished_stamp),
			"headline": 	books[i].author_fl + " &mdash; " + books[i].title,
			"asset": {
				"media": 	books[i].cover,
				"credit": 	"",
				"caption": 	"<div class='star' data-rating='" + books[i].rating + "'></div>"
			}
		});
	}

	var timeline = new VMM.Timeline();
	timeline.init(booksJSON);
	$(".star").raty({
		half: 		true,
		path: 		"lib",
		readOnly: 	true,
		start: function() {
			return $(this).attr("data-rating");
		}
	});
}

// sorts an array of books by ...
function byFinishedAscending(a, b) {
	// todo: find out if 0 is the latest or should we take startfinishdates[len(...)]
	// shortcuts (bonus: isolates todo above to following two lines)
	var a = a.startfinishdates[0];
	var b = b.startfinishdates[0];

	// unfinished default to this moment (ie. in front of the list)
	var aFinished = a.finished_stamp || new Date().getTime();
	var bFinished = b.finished_stamp || new Date().getTime();

	// corner case: a and b are both unfinished. then sort by start date
	if (!a.finished_stamp && !b.finished_stamp) {
		aFinished = a.started_stamp;
		bFinished = b.started_stamp;
	} 

	return aFinished - bFinished;
}

function timelineDate(librarythingTimestamp) {
	// returns string "year,month,date" for a timestamp returned by the librarything api
	var d = new Date(librarythingTimestamp*1000);
	return d.getFullYear() + "," + (d.getMonth()+1) + "," + d.getDate() ;
}

var api_root = "http://www.librarything.com/api_getdata.php?callback=?";
var params = {
	userid: 	"",
	//key:    2413956462,
	showTags: 	1,
	showDates: 	1,	// undocumented
	limit: 		"bookswithstartorfinishdates",	// undocumented, see http://www.librarything.com/topic/40698
	max: 		100000,	// just get all the books (at the time of writing largest library was ~45,000 books)
	//coverheight: 150,   // apparent maximum, also: if left unspecified only covers from amazon.com work
	coverwidth: 150,	// apparent maximum, also: if left unspecified only covers from amazon.com work
};

$(function () {
	$("#badabing").submit(function(event) {
		event.preventDefault();
		params.userid = $("#userid").val();
		$.getJSON(api_root, params, jsonifyBooks);
	});
});