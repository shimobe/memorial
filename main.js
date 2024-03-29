// display string, refered in entry[].type
var singer_lookup = [
	"", 		// 0b 0000
	"",			//    0001
	"",			//    0010
	"",			//    0011
	"逢魔きらら",	//    0100
	"きらにぃあ",	//    0101
	"ももきら",	//    0110
	"ぷちここ",	//    0111
];

// series search
var series_lookup = {
	"マクロス" : ["マクロス", "まくろす"],
	"ラブライブ" : ["ラブライブ", "らぶらいぶ", "LL", "ll"],
	"アイマス" : ["アイマス", "あいます", "デレマス", "でれます"],
	"ジブリ" : ["ジブリ", "じぶり"],
	"物語シリーズ" : ["物語シリーズ", "ものがたりしりーず", "ものがたりシリーズ"],
	"まどマギ" : ["まどマギ", "まどまぎ", "まどか"],
};

// indices lookup
var entry_idx = {
	song_id : 0,
	video : 1,
	note : 2,
	time : 3,
	type : 4
};
var song_idx = {
	name : 0,
	artist : 1,
	reading : 2,
	attr : 3,
	release : 4
};
var video_idx = {
	id : 0,
	date : 1
};

var version = "1.4.1";

/* control / memories */

// prevent menu from opening when info or setting is up
var prevent_menu_popup = false;

// current page name
var current_page = "home";

// home total height
var home_height = 0;
var home_change_visual = [{start : 0, end : 0}, {start : 0, end : 0}];

// save state of display ruby, can do this with attr reading but nah
var ruby_master = true;

/* setting section */
// max display song count
var max_display = 100;

// if on, display private entries despite not accessable
var do_display_hidden = false;

// if the previous input should be cleared when user tap input box
var do_clear_input = false;

// if random requirement is ignored (input being blank)
var do_random_anyway = false;

// ram for searching (entry_processed)
var entry_proc = [];

$(document).ready(function() {
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		// on mobile, do nothing
	} else {
		// check screen ratio
		// and hope nobody use some super-duper long screen
		if (window.innerHeight / window.innerWidth < 1.3) {
			// bad screen ratio, open new window
			$("#v_screen").addClass("post_switch");
			$("#v_screen").height("100%");
			$("#v_screen").width(0.5625 * window.innerHeight);
			$("#v_screen").attr("src", "index.html" + window.location.search);
			// hide original page
			$("body > div").addClass("post_switch");
			$("body").addClass("post_switch");
			return;
		}
	}
	// get url para
	var url_para = new URLSearchParams(window.location.search);
	var target_page = url_para.get("page");
	init();
	if (target_page === "home") {
		update_visual();
	} else {
		if (jump2page(target_page) === -1) {
			jump2page("home");
		}
	}
	
	{	// stream, song data
		$("#home_note_stream").html("(" + stream[stream.length - 1][str_idx.date].slice(0, 10) + "迄)");
		$("#home_note_song").html("(" + stream[stream.length - 1][str_idx.date].slice(0, 10) + "迄, メン限/非公開/他枠含む)")
		
		var c_stream  = 0,
			c_member  = 0,
			c_singing = 0,
			c_asmr    = -1,	// counter 
			c_slcolab = 0;
		for (var i in stream) {
			c_stream  += (stream[i][str_idx.attr] & (1 << str_attr.othercolab[1])) ? 0 : 1;
			c_member  += (stream[i][str_idx.attr] & (1 << str_attr.member[1])) ? 1 : 0;
			c_singing += ((stream[i][str_idx.attr] & (1 << str_tag.singing[1])) && !(stream[i][str_idx.attr] & (1 << str_attr.othercolab[1]))) ? 1 : 0;
			c_asmr    += ((stream[i][str_idx.attr] & (1 << str_tag.asmr[1])) && !(stream[i][str_idx.attr] & (1 << str_attr.othercolab[1]))) ? 1 : 0;
			c_slcolab += (stream[i][str_idx.attr] & (1 << str_attr.selfcolab[1])) ? 1 : 0;
		}
		
		$("#home_count_stream").html(c_stream + "回");
		$("#home_count_member").html(c_member + "回");
		$("#home_count_singing").html(c_singing + "回");
		$("#home_count_asmr").html(c_asmr + "回");
		$("#home_count_selfcollab").html(c_slcolab + "回");
		
		// get values from data
		$("#home_count_song").html(entry.length + "回");
		var rep_count = 0;
		for (var i in entry_proc) {
			rep_count += entry_proc[i].length === 0 ? 0 : 1;
		}
		$("#home_count_rep").html(rep_count + "曲");
		// set ranking
		var e = [...Array(song.length).keys()];
		e.sort(function(a, b) {
			return entry_proc[b].length - entry_proc[a].length;
		});
		var new_html = "";
		var loaded_records = 0,
			lastest_count = -1;
		do {
			new_html += "<div class=\"row-" + (loaded_records + 1) + " col-1\">" + song[e[loaded_records]][song_idx.name] + "</div>";
			new_html += "<div class=\"row-" + (loaded_records + 1) + " col-2\">" + entry_proc[e[loaded_records]].length + "回</div>";
			loaded_records++;
		} while (!(loaded_records >= 10 && lastest_count != entry_proc[e[loaded_records + 1]].length));
		$(".home_gridsong").html(new_html);
	}
	// remove loading screen
	$("#loading_overlay").addClass("hidden");
});

$(function() {
	{ // nav
		// nav - menu
		$(document).on("click", "#nav_menu", function(e) {
			// disable going back to top
			e.preventDefault();
			if (prevent_menu_popup) {
				return;
			}
			$("#menu_container").toggleClass("hidden");
			$("#nav_menu").toggleClass("menu_opened");
			$(document.body).toggleClass("no_scroll");
		});
		
		// nav - random
		$(document).on("click", "#nav_search_random", function() {
			if($(this).hasClass("disabled") && !do_random_anyway) {
				return;
			}
			if (prevent_menu_popup) {
				return;
			}
			// check if the song has any visibile record
			var random_song,
				found = trial = 0,
				sel_member = 7;
			for (var i in singer_chosen) {
				if (!singer_chosen[i]) {
					sel_member -= 1 << i;
				}
			}
			if (sel_member === 0) {
				// no body got selected so
				return;
			}
			do {
				random_song = Math.floor(Math.random() * song.length);
				for (var i in entry_proc[random_song]) {
					// check if all member
					if (sel_member !== 7) {
						if (!(sel_member & entry[entry_proc[random_song][i]][entry_idx.type])) {
							continue;
						}
					}
					if ((!do_display_hidden) && is_private(entry_proc[random_song][i])) {
						continue;
					}
					found++;
					break;
				}
			} while (found === 0);
			$("#input").val(song[random_song][song_idx.name]);
			search();
		});
		
		// nav - to_top
		$(document).on("click", "#nav_to_top", function(e) {
			e.preventDefault();
			if (prevent_menu_popup) {
				return;
			}
			$("html,body").animate({
				scrollTop: 0
			}, "fast");
		});
	}
	
	{ // home
		$(window).on("scroll", function() {
			if (current_page !== "home") {
				return;
			}
			update_visual($(this).scrollTop());
		});
	}
	
	{ // poem
		// poem - toggle block ruby visibility
		$(document).on("click", ".poem_block", function(e) {
			// check if click on poem_block
			$("#" + $($(e.target).closest(".poem_block")).attr("id") + " rt").toggleClass("no_ruby");
		});
		
		// poem - toggle all ruby visibility
		$(document).on("click", "#poem_contorl_button", function() {
			$(".poem_button").toggleClass("selected");
			$("rt").toggleClass("no_ruby", ruby_master);
			ruby_master = !ruby_master;
		});
	}
	
	{ // menu
		// menu -fog> return
		$(document).on("click", "#menu_container", function(e) {
			if (!($(e.target).parents(".defog").length || $(e.target).hasClass("defog"))) {
				$("#menu_container").addClass("hidden");
				$("#nav_menu").removeClass("menu_opened");
				$(document.body).removeClass("no_scroll");
			}
		});
		
		// menu -> page
		$(document).on("click", ".menu2page", function(e) {
			var target = ($(e.target).attr("id")).replace("menu2page_", "");
			jump2page(target);
		});
		
		// menu - information
		$(document).on("click", "#menu_info", function() {
			$("#popup_container").removeClass("hidden");
			$("#information").removeClass("hidden");
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
			prevent_menu_popup = true;
		});
		
		// menu - settings
		$(document).on("click", "#menu_setting", function() {
			$("#popup_container").removeClass("hidden");
			$("#setting").removeClass("hidden");
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
			prevent_menu_popup = true;
			// change name<->icon position according to if scrollbar is present
			// this thing doesnt really work but also very not likely to be even triggered so anyways
			if ($("#setting_defog").get(0).scrollHeight > $("#setting_defog").height()) {
				$("#setting_singer_display").addClass("scrollbar_present");
			}
		});
	}

	// information -fog> return
	$(document).on("click", "#information", function(e) {
		if ($(e.target).attr("id") === "information") {
			$("#information").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).removeClass("no_scroll");
			prevent_menu_popup = false;
		}
	});
	
	{ // setting
		// setting - 0 : display maximum
		$(document).on("input", "#setting_max-display_value", function() {
			var e = $("#setting_max-display_value").val();
			
			// remove anything thats not 0~9
			e = e.replace(/[^\d]/g, "");
			
			// check if e is blank (after replace)
			if (e === "") {
				$("#setting_max-display_value").val(e);
				return;
			}
			
			// check min max
			e = Math.min(400, Math.max(1, parseInt(e)));
			$("#setting_max-display_value").val(e);
		});
		
		// setting - 0 - blur input
		$(document).on("keydown", function(e) {
			if (e.keyCode === 13) {
				$("#setting_max-display_value").blur();
			}
		})
		
		// setting - 1 : do diplay hidden switch update
		$(document).on("change", "#setting_display-private_checkbox", function(e) {
			do_display_hidden = e.target.checked;
		});
		
		// setting - 2 : reset input
		$(document).on("change", "#setting_reset-input_checkbox", function(e) {
			do_clear_input = e.target.checked;
		});
		
		// setting - 4 : ignore random requirement
		$(document).on("change", "#setting_random_checkbox", function(e) {
			do_random_anyway = e.target.checked;
		});
		
		// setting - 90 : reset to default
		$(document).on("click", "#setting_default", function(e) {
			// prevent going back to top
			e.preventDefault();
			// revert value
			max_display = 100;
			do_display_hidden = false;
			do_clear_input = false;
			do_random_anyway = false;
			
			// update display
			$("#setting_max-display_value").val(max_display);
			$("#setting_display-private_checkbox").prop("checked", do_display_hidden);
			$("#setting_reset-input_checkbox").prop("checked", do_clear_input);
			$("#setting_random_checkbox").prop("checked", do_random_anyway);
		});
		
		// setting - 91 : confirm
		$(document).on("click", "#setting_confirm", function(e) {
			// prevent going back to top
			e.preventDefault();
			$("#setting").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).removeClass("no_scroll");
			prevent_menu_popup = false;
			// assign values (those are not changed on edit)
			max_display = parseInt($("#setting_max-display_value").val());
			if (do_random_anyway) {
				$("#nav_search_random").removeClass("disabled");
			} else {
				if ($("#input").val() === "") {
					$("#nav_search_random").removeClass("disabled");
				} else {
					$("#nav_search_random").addClass("disabled");
				}
			}
			loading = "";
			search();
		});
	}
});

function init() {
	// $(window).scrollTop($("#home_section").offset().top);
	$("#input").val("");
	// process data
	for (var i in song) {
		entry_proc[i] = [];
	}
	for (var i = 0; i < entry.length; ++i) {
		entry_proc[entry[i][0]].push(i);
	}
	$("#info_version").html(version);
	$("#info_last-update").html(video[video.length - 1][video_idx.date]);
	// get screen size
	auto_display_max = Math.floor(5 * Math.pow(window.innerHeight / window.innerWidth, 1.41421356237));
	
	// rep
	// get each member's repertoire
	for (var i = 0; i < song.length; ++i) {
		rep_list[i] = 0
		for (var j in entry_proc[i]) {
			// check if all singer bits are filled
			if ((rep_list[i] & 7) === 7) {
				break;
			}
			// or is faster than checking then add (i think)
			rep_list[i] |= entry[entry_proc[i][j]][entry_idx.type];
		}
		// remove the non-singer bit, not needed.
		rep_list[i] &= ~8;
	}
	// load home values
	home_height = $("#home_section").height() - window.innerHeight;
	var section_height = home_height / 11;
	home_change_visual[0].start = section_height * 3;
	home_change_visual[0].end   = section_height * 4;
	home_change_visual[1].start = section_height * 7;
	home_change_visual[1].end   = section_height * 8;
}

function update_visual(cur_scroll = 0) {
	for (var i = 0; i < 2; ++i) {
		if ((home_change_visual[i].start < cur_scroll) && (cur_scroll < home_change_visual[i].end)) {
			var ratio = (cur_scroll - home_change_visual[i].start) / (home_change_visual[i].end - home_change_visual[i].start);
			$(".clothe" + i).removeClass("hidden");
			$(".clothe" + i).css("opacity", 0.666 * (1 - ratio ** 2));
			$(".clothe" + (i + 1)).removeClass("hidden");
			$(".clothe" + (i + 1)).css("opacity", 0.666 * (1 - ( 1 - ratio) ** 2));
			return;
		} else {
			// hide others
			if (cur_scroll < home_change_visual[0].start) {
				$(".clothe0").removeClass("hidden");
				$(".clothe1").addClass("hidden");
				$(".clothe2").addClass("hidden");
				$(".clothe0").css("opacity", 0.666);
			} else if (cur_scroll < home_change_visual[1].start) {
				$(".clothe0").addClass("hidden");
				$(".clothe2").addClass("hidden");
				$(".clothe1").css("opacity", 0.666);
			} else {
				$(".clothe1").addClass("hidden");
				$(".clothe2").removeClass("hidden");
				$(".clothe2").css("opacity", 0.666);
			}
		}
	}
}

function load_poem() {
	// load display
	var new_html = "";
	for (var i = 0; i < poem_data.length; ++i) {
		if (i % 10 === 0) {
			// add anchor target
			new_html += ("<div id=\"poem_target_" + (i + 1) + "\" class=\"poem_target\"></div>");
		}
		new_html += ("<div id=\"poem_" + (i + 1) + "\" class=\"poem_block\"><div class=\"poem_no\">" + fill_digit(i + 1, 3) + "</div>");
		new_html += poem_to_html(i);
		new_html += "</div>";
	}
	$("#poem_display").html(new_html);
	// load sidebar
	new_html = "";
	for (var i = 0; i < 12; ++i) {
		new_html += ("<div class=\"poem_side_button\"><a href=\"#poem_target_" + (i * 10 + 1) + "\">" + fill_digit(i * 10 + 1, 3) + "</a></div>");
	}
	$("#poem_sidebar_inner").html(new_html);
}

function poem_to_html(id) {
	var e = poem_data[id];
	var output = "<div class=\"poem_poem\">";
	output += e.replaceAll(")(", "</rt>")
			   .replaceAll( "(", "<ruby>")
			   .replaceAll(",!", "<rt class=\"force_ruby\">")
			   .replaceAll( ",", "<rt>")
			   .replaceAll( ")", "</rt></ruby>")
			   .replaceAll("\n", "<br />")
			   .replace(   "$a", "</div><div class=\"poem_author\">")
			   .replace(  "匿名", "詠み人知らず")
			   .replaceAll( "[", "(")
			   .replaceAll( "]", ")");
	return (output + "</div>");
}

function jump2page(target) {
	if (target !== current_page) {
		current_page = target;
		$(".menu2page_selected").removeClass("menu2page_selected");
		$("#menu2page_" + target).addClass("menu2page_selected");
		
		// show / hide section
		$(".section_container").addClass("hidden");
		
		// hide all icon
		$("#nav_search_random").addClass("hidden");
		$("#nav_share_rep").addClass("hidden");
		$("#nav_str_info").addClass("hidden");
		$("#nav_dummy").addClass("hidden");
		$(window).scrollTop(0);
		
		switch (target) {
			case "home" : 
				// show section
				$("#home_section").removeClass("hidden");
				$("#nav_title").html("ホーム");
				$("#nav_dummy").removeClass("hidden");
				update_visual(0);
				break;
			case "search" :
				// show section
				$("#search_section").removeClass("hidden");
				$("#nav_title").html("曲検索");
				$("#nav_search_random").removeClass("hidden");
				// reset input -> reload
				$("#input").val("");
				search();
				break;
			case "repertoire" : 
				// show section
				$("#repertoire_section").removeClass("hidden");
				$("#nav_title").html("レパートリー");
				$("#nav_share_rep").removeClass("hidden");
				rep_search();
				break;
			case "stream" :
				// show section
				$("#stream_section").removeClass("hidden");
				$("#nav_title").html("配信一覧");
				$("#nav_str_info").removeClass("hidden");
				str_search();
				break;
			case "poem" : 
				// show section
				$("#poem_section").removeClass("hidden");
				$("#nav_title").html("百人一首");
				$("#nav_dummy").removeClass("hidden");
				if ($("#poem_display").html() === "") {
					load_poem();
				}
				break;
			default : 
				return -1;
		}
		
		// close menu
		$("#menu_container").addClass("hidden");
		$("#nav_menu").removeClass("menu_opened");
		$(document.body).removeClass("no_scroll");
	}
	return 0;
}

// functional functions

// display date in yyyy-MM-dd format
function display_date(input) {
	var e = typeof(input) === "string" ? new Date(input) : input;
	return (e.getFullYear() + "-" + fill_digit(e.getMonth() + 1, 2) + "-" + fill_digit(e.getDate(), 2));
}

// add 0 in front of a number
function fill_digit(input, target_length) {
	e = "" + input;
	while (e.length < target_length) {
		e = "0" + e;
	}
	return e;
}

function is_private(index) {
	return entry[index][entry_idx.note].includes("非公開") || entry[index][entry_idx.note].includes("記録用") || entry[index][entry_idx.note].includes("アーカイブなし");
}

function bold(org, selc) {
	var e = org.toLowerCase().indexOf(selc.toLowerCase());
	if (e === -1 || selc === "") {
		return org;
	} else {
		return (org.substring(0, e) + "<b>" + org.substring(e, e + selc.length) + "</b>" + org.substring(e + selc.length));
	}
}

function get_last_sang(id, mask = 7) {
	for (var i = entry_proc[id].length - 1; i >= 0; --i) {
		if (mask & entry[entry_proc[id][i]][entry_idx.type]) {
			return new Date(video[entry[entry_proc[id][i]][entry_idx.video]][video_idx.date]);
		}
	}
	// not found;
	return 0;
}

// returns a date object for a "dd-mm-yyyy" input
function to8601(date_string) {
	return new Date(
		date_string.substring(6),
		parseInt(date_string.substring(3, 5)) - 1,
		date_string.substring(0, 2)
	);
}

var today = new Date().setHours(0, 0, 0, 0);

// get day different between {date1 and date2} or {date1 and today}
function get_date_different(date1, date2 = today) {
	date1 = (typeof(date1) === "string") ? new Date(date1) : date1;
	date2 = date2 === undefined ? date2 : new Date(date2);
	return Math.round(Math.abs(date1 - date2) / 86400000);
}

// get entry count of all entry and member-only entry that fufills mask
function get_sang_count(id, mask = 7) {
	var count = 0,
		mem_count = 0;
	for (var i in entry_proc[id]) {
		if (entry[entry_proc[id][i]][entry_idx.type] & mask) {
			count++;
			if (entry[entry_proc[id][i]][entry_idx.note].includes("【メン限")) {
				mem_count++;
			}
		}
	}
	return [count, mem_count];
}

function get_attr(id) {
	var e = entry[id][entry_idx.note];
	if (e.includes("ASMR弾き語り")) {
		return "asm";
	}
	if (e.includes("弾き語り")) {
		return "gui";
	}
	if (e.includes("アカペラ")) {
		return "aca";
	}
	return "oke";
}