var str_using_and = true,
	str_sort_date = true,
	str_sort_asd  = true;

var str_tag = {
	singing : [1, 0],
	game : [1, 1],
	talking : [1, 2],
	maro : [1, 3],
	topic : [1, 4],
	asmr : [1, 5],
	memo : [1, 6],	// MEMOrial
	other : [1, 7]
};

var str_game = {
	join : [1, 8],
	horror : [1, 9],
	mc : [1, 10],
	pen : [1, 11],	// PENalty
	other : [1, 12]
}

var str_attr = {
	member : [1, 13],
	selfcolab : [1, 14],
	othercolab : [1, 15]
}

var str_idx = {
	id : 0,
	date : 1,
	state : 2,
	attr : 3,
	title : 4,
	length : 5
}

var nrpr_mem = [
	"犬山たまき",
	"白雪みしろ",
	"愛宮みるく",
	"熊谷タクマ",
	"姫咲ゆずる",
	"鬼灯わらべ",
	"夢乃リリス",
	"逢魔きらら",
	"胡桃澤もも",
	"看谷にぃあ"
];

var processed_title = [];
/* element : array of 3
 * 
 * [0] : array of non-member tag in 【】, last element is ignored if >= 2 elements
 * [1] : actual title
 * [2] : member in video, 0 if not collab
 *
 */
$(document).ready(function() {
	for (var i in stream) {
		processed_title[i] = [, , 0];
		var org_title = stream[i][str_idx.title];
		
		// tag
		processed_title[i][0] = org_title.match(/【([^】]*)】/g);
		if (processed_title[i][0] !== null) {
			for (var j = 0; j < processed_title[i][0].length; ++j) {
				if (!/のりプロ所属/g.test(processed_title[i][0][j])) {
					processed_title[i][0][j] = processed_title[i][0][j].replace(/[#【】]/g, "");
				}
			}
		}
		
		// title
		processed_title[i][1] = org_title.replace(/【.*?】/g, "");
		
		//member
		// check if the stream is tagged as collab
		if (stream[i][str_idx.attr] & (3 << 14)) {
			for (var j = 0; j < nrpr_mem.length; ++j) {
				if (org_title.includes(nrpr_mem[j])) {
					processed_title[i][2] |= 1 << j;
				}
			}
			
			// just doing things manually
			if (stream[i][str_idx.id] === "2F_G6gZa2gs") {
				processed_title[i][2] = 0b1111100010;
			}
			if (stream[i][str_idx.id] === "tcaNLhN9Goo") {
				processed_title[i][2] += 1;
			}
			if (stream[i][str_idx.id] === "i6Llc4UDRD8" || stream[i][str_idx.id] === "Qp6y6lN10N4") {
				processed_title[i][2] = 0b1111100000;
			}
			if (stream[i][str_idx.id] === "qh6TiQSMLaU") {
				processed_title[i][2] = 0b0110000000;
			}
		}
		

	}
});

$(function() {
	// input - submit
	$(document).on("blur", "#str_input", function() {
		str_search();
	});
	
	// input::enter -> blur
	$(document).on("keydown", function(e) {
		if (e.keyCode === 13) {
			$("#str_input").blur();
		}
	});
	
	// hide / show block
	$(document).on("click", ".str_search_title", function() {
		var e = $(this).prop("id").replace(/(str_label_)/, "");
		$("#str_close_" + e).toggleClass("closed");
		$("#str_content_" + e).toggleClass("hidden");
	});
	
	// tag or game subblock selection
	$(document).on("click", ".str_tag_button", function() {
		var e = $(this).attr("id").replace(/(str_op_)/, "");
		var group = e.includes("tag_") ? "tag" : "game";
		if (e === "tag_game") {
			// toggle
			$("#str_search_game").toggleClass("hidden", $("#str_checkbox_tag_game").hasClass("selected"));
		}
		// check if all
		if (e.includes("_all")) {
			$(".str_gp_" + group).toggleClass("selected", !$("#str_checkbox_" + group + "_all").hasClass("selected"));
			for (var i in (group === "tag" ? str_tag : str_game)) {
				if (group === "tag") {
					str_tag[i][0] = $("#str_checkbox_tag_all").hasClass("selected");
				} else {
					str_game[i][0] = $("#str_checkbox_game_all").hasClass("selected");
				}
			}
			// test if the above process selected / de-selected tag::game
			if (group === "tag") {
				$("#str_search_game").toggleClass("hidden", !$("#str_checkbox_tag_all").hasClass("selected"));
			}
		} else {
			$("#str_checkbox_" + e).toggleClass("selected");
			if (group === "tag") {
				str_tag[e.replace(/(tag_)/, "")][0] ^= 1;
			} else {
				str_game[e.replace(/(game_)/, "")][0] ^= 1;
			}
			if (!$("#str_checkbox_" + e).hasClass("selected")) {
				// if not selected, remove all's selected class
				$("#str_checkbox_" + group + "_all").removeClass("selected");
			} else {
				// else check if all selected
				var all_selected = true;
				for (var i in (group === "tag" ? str_tag : str_game)) {
					all_selected &= group === "tag" ? str_tag[i][0] : str_game[i][0];
					if (!all_selected) {
						break;
					}
				}
				$("#str_checkbox_" + group + "_all").toggleClass("selected", all_selected ? true : false);
			}
		}
		str_search();
	});
	
	// selection method
	$(document).on("click", ".str_method_button", function() {
		var to_and = $(this).attr("id").includes("and") ? 1 : 0;
		if (to_and === str_using_and) {
			return;
		}
		// change display
		$(".str_method_button>.radio").toggleClass("selected");
		// assign value
		str_using_and = to_and;
		// change other buttons
		$(".str_tag_checkbox").toggleClass("str_tag_and", to_and);
		str_search();
	});
	
	// attr selection
	$(document).on("click", ".str_attr_button", function() {
		var e = $(this).attr("id").replace(/(str_attr_op_)/, "");
		$("#str_attr_checkbox_" + e).toggleClass("selected");
		str_attr[e][0] ^= 1;
		str_search();
	});
	
	// sort buttons
	$(document).on("click", ".str_sort_button", function() {
		var e = $(this).attr("id").replace(/(str_op_sort_)/, "");
		switch (e) {
			case "date" :
			case "length" :
				if ((e === "date" && str_sort_date) || (e === "length" && !str_sort_date)) {
					// nothing change
					break;
				}
				str_sort_date ^= 1;
				$(".str_sort1").toggleClass("selected");
				$("#str_sort_op1").html(str_sort_date ? "新しい順" : "長い順");
				$("#str_sort_op2").html(str_sort_date ? "古い順" : "短い順");
				break;
			case "asd" :
			case "des" :
				if ((e === "asd" && str_sort_asd) || (e === "des" && !str_sort_asd)) {
					// nothing change
					break;
				}
				str_sort_asd ^= 1;
				$(".str_sort2").toggleClass("selected");
				break;
		}
		str_display();
	});
	
	// click to video
	$(document).on("click", ".str_display_item", function() {
		var e = parseInt($(this).attr("id"));
		if (stream[e][str_idx.state] === 0) {
			window.open("https://youtu.be/" + stream[e][str_idx.id], "_blank");
		}
	})
});

var str_selected = [];
var str_input_hits = 0;
var str_input_mem = "";

function str_search() {
	// reset
	
	// input part
	var input_value = $("#str_input").val();
	if (input_value !== str_input_mem) {
		str_selected = [];
		str_input_mem = input_value;
		str_input_hits = 0;
		if (input_value !== "") {
			for (var i = 0; i < stream.length; ++i) {
				if (stream[i][str_idx.title].includes(input_value)) {
					str_selected.push(i);
					str_input_hits++;
				}
			}
		}
	} else {
		// keep search part
		str_selected = str_selected.slice(0, str_input_hits);
	}
	
	// generate mask
	var str_mask = 0,
		str_attr_mask = (1 << 13) - 1;
	for (var i in str_tag) {
		str_mask |= str_tag[i][0] << str_tag[i][1];
	}
	if (str_tag["game"][0]) {
		for (var i in str_game) {
			str_mask |= str_game[i][0] << str_game[i][1];
		}
	}
	for (var i in str_attr) {
		str_attr_mask |= str_attr[i][0] << str_attr[i][1];
	}
	for (var i = 0; i < stream.length; ++i) {
		if (str_selected.includes(i)) {
			continue;
		}
		// if that stream ONLY consistof collab tag
		if ((stream[i][str_idx.attr] & (str_attr.selfcolab[0] << str_attr.selfcolab[1])) ||
			(stream[i][str_idx.attr] & (str_attr.othercolab[0] << str_attr.othercolab[1]))) {
				str_selected.push(i);
				continue;
		}
		var local_mask = stream[i][str_idx.attr] & ((1 << 13) - 1);
		if (local_mask === 0 && str_using_and) {
			continue;
		}
		// if using and , remove anything that contains anything not selected, else add everything include selected
		if (str_using_and ? !(local_mask & (~str_mask >>> 0)) : stream[i][str_idx.attr] & str_mask) {
			// check archive attr
			if (!(stream[i][str_idx.attr] & ~str_attr_mask)) {
				str_selected.push(i);
			}
		}
	}
	str_display();
}

function str_display() {
	// sort
	var str_sorted = [];
	if (str_input_hits <= 1) {
		// does not have to sort the input part
		str_sorted = str_selected.slice(0, str_input_hits);
	} else {
		// have to sort the input part
		var str_input_part = str_selected.slice(0, str_input_hits);
		str_input_part.sort(function(a, b) {
			if (str_sort_date) {
				// sort date
				return (str_sort_asd ? -1 : 1) * (a - b);
			} else {
				// sort length
				return (str_sort_asd ? -1 : 1) * (stream[a][str_idx.length] - stream[b][str_idx.length]);
			}
		});
		str_sorted = str_input_part;
	}
	
	// sort the rest of the record
	var str_attr_part = str_selected.slice(str_input_hits);
	str_attr_part.sort(function(a, b) {
		if (str_sort_date) {
			// sort date
			return (str_sort_asd ? -1 : 1) * (a - b);
		} else {
			// sort length
			return (str_sort_asd ? -1 : 1) * (stream[a][str_idx.length] - stream[b][str_idx.length]);
		}
	});
	str_sorted = str_sorted.concat(str_attr_part);
	
	// display
	var new_html = "";
	
	for (var i in str_sorted) {
		// outer block
		new_html += "<div class=\"str_display_item" + (stream[str_sorted[i]][str_idx.state] === 0 ? "" : " private") + "\" id=\"" + str_sorted[i] + "\">";
		// 1st line - date
		new_html += ("<div class=\"str_item_1stline\"><div class=\"str_item_date\">" + stream[str_sorted[i]][str_idx.date] + "</div>");
		// 1st line - length
		new_html += ("<div class=\"str_item_length\">" + to_hmmss(stream[str_sorted[i]][str_idx.length]) + "</div></div>");
		// 2nd line - container
		new_html += "<div class=\"str_item_2ndline\">";
		// 2nd line - tag
		if (processed_title[str_sorted[i]][0] !== null) {
			new_html += "<div class=\"str_item_tags\">";
			for (var j = 0; j < processed_title[str_sorted[i]][0].length; ++j) {
				if (processed_title[str_sorted[i]][0][j] === "逢魔きらら") {
					continue;
				}
				if (processed_title[str_sorted[i]][0][j].includes("のりプロ所属")) {
					break;
				}
				var f = processed_title[str_sorted[i]][0][j].replace(/(逢魔きらら\/|\/逢魔きらら|逢魔きらら／|／逢魔きらら|\/のりプロ)/, "");
				// do not need momo's name after momokira
				if (f.includes("ももきら")) {
					f = "ももきら";
				}
				new_html += ("<div class=\"str_item_subtag\">" + f + "</div>");
			}
			new_html += "</div>";
		}
		// 2nd line - title
		new_html += ("<div class=\"str_item_title\">" + processed_title[str_sorted[i]][1] + "</div></div>");
		// add members if collab
		if (stream[str_sorted[i]][str_idx.attr] & (3 << 14)) {
			// 3rd line - container
			new_html += "<div class=\"atr_item_3rdline\">";
			for (var j = 0; j < nrpr_mem.length; ++j) {
				// if member exist, add icon
				if (processed_title[str_sorted[i]][2] & (1 << j)) {
					new_html += "<div class=\"str_icon_mem_" + j + "\"></div>";
				}
			}
			new_html += "</div>"
		}
		new_html += "</div>";
	}
	
	$("#str_display").html(new_html);
}

function to_hmmss(input) {
	// input int of sec
	return ((input / 3600) >> 0) + ":" + fill_digit(((input % 3600) / 60) >> 0, 2) + ":" + fill_digit(input % 60, 2);
}

function str_process_title(input) {
	var org_title = stream[input][str_idx.title];
	// extract
	console.log(org_title);
	var meta = org_title.match(/【([^】]*)】/g);
	var title = org_title.replace(/【.*?】/g, "");
	if (meta !== null) {
		for (var i = 0; i <  meta.length; ++i) {
			if (/\//g.test(meta[i])) {
				meta.splice(i--, 1);
			} else {
				meta[i] = meta[i].replace(/[#【】]/g, "");
			}
		}
	}

	console.log(meta, title);
}