var moment = require('moment-timezone');
import ProjectViewer from './ProjectViewer';

var theDate;
var colorNYC = {r:154, g:184, b:206};
var colorLA = {r:243, g:129, b:153};
var mouseX, mouseY, timeIncrementer;
var speedTime = 100;//milliseconds to increment
var currentColorWheel = [[45, 57, 89], [97, 112, 164], [222, 205, 242], [255, 229, 210], [255, 224, 134], [255, 229, 251], [210, 196, 234], [82, 98, 146]];
var projectViewer;

function ready(fn) {
	if (document.readyState != 'loading'){
		fn();
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

ready(function () {
	var timeIncrementer = parseInt(moment().format('X'));
	var body = document.querySelector('body');

	projectViewer = new ProjectViewer();

	mouseX = 0;
	mouseY = 0;
	body.addEventListener('mousemove', function(e) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		followCursor();
	})

	function outerWidth(el) {
		var width = el.offsetWidth;
		var style = getComputedStyle(el);

		width += parseInt(style.marginLeft) + parseInt(style.marginRight);
		return width;
	}

	function followCursor() {
		var body = document.querySelector('body');
		var percentX = mouseX / outerWidth(body);
		var cursorR = interpolate(colorLA.r, colorNYC.r, percentX);
		var cursorG = interpolate(colorLA.g, colorNYC.g, percentX);
		var cursorB = interpolate(colorLA.b, colorNYC.b, percentX);
		body.style.background = '-webkit-radial-gradient(' + mouseX + 'px ' + mouseY + 'px, 1000px 1000px, rgb(' + cursorR + ',' + cursorG + ',' + cursorB + ') 0%,rgb(237,243,216) 100%)'
	}

	setInterval(updateGradient, speedTime);

	function updateGradient() { //determine RGB colors from an 8 point color wheel
		var time = moment().tz("America/New_York");

		var timeNYC = parseInt(time.format('H')) * 60 + parseInt(time.format('m'));
		var timeLA = timeNYC >= 180 ? timeNYC - 180 : 1440 - (180 - timeNYC);
		if (timeLA >= 1440) { timeLA = 0; }
		var NYCpercent = currentColorWheel.length * timeNYC / 1440;
		var NYCtripletIndex1 = Math.floor(NYCpercent);
		var NYCtripletIndex2 = NYCtripletIndex1 < currentColorWheel.length - 1 ? NYCtripletIndex1 + 1 : 0;
		var NYCcolorInterpolate = NYCpercent % 1;

		var LApercent = currentColorWheel.length * timeLA / 1440;
		var LAtripletIndex1 = Math.floor(LApercent);
		var LAtripletIndex2 = LAtripletIndex1 < currentColorWheel.length - 1 ? LAtripletIndex1 + 1 : 0;
		var LAcolorInterpolate = LApercent % 1;

		var i=0;
		for (let color in colorNYC) {
			colorNYC[color] = interpolate(currentColorWheel[NYCtripletIndex1][i], currentColorWheel[NYCtripletIndex2][i], NYCcolorInterpolate);
			colorLA[color] = interpolate(currentColorWheel[LAtripletIndex1][i], currentColorWheel[LAtripletIndex2][i], LAcolorInterpolate);
			i++;
		}
		followCursor();
	}

	function interpolate(color1, color2, percent) {
		let x = Math.round(color1 - (color1 - color2) * percent);
		return x;
	}

	// expand.init();
});
