import SAT from 'sat';
import prefixAll from 'inline-style-prefixer/static';
import DOMUtils from './DOMUtils';
import { applyCSSAnimation } from './CSSAnimationChainer.js';

export default class Slider {
	constructor(wrapper, dmt, opts) {
		this.durations = {
			auto: 5000,
			slide: 1400
		};
		// DOM
		this.dom = {
			wrapper: null,
			current: null,
			next: null,
			arrow: null
		};
		// Misc stuff
		this.length = 0;
		this.current = 0;
		this.next = 0;
		this.isAuto = false;
		this.working = false;
		this.dom.wrapper = wrapper;
		this.dom.slides = this.dom.wrapper.querySelectorAll('.slide');
		this.dom.arrow = this.dom.wrapper.querySelectorAll('.arrow');
		this.length = this.dom.slides.length;
		this.mustDestroy = false;
		this.dmt = dmt;
		this.init();
	}

	init() {
		console.log('HELLO');
		for (let slide of this.dom.slides) {
			slide.style.zIndex = 10;
		}

		this.dom.current = this.dom.slides[this.current];
		this.dom.current = this.dom.slides[this.current];
		this.dom.next = this.dom.slides[this.current + 1];
		this.dom.current.style.zIndex = 30;
		this.dom.next.style.zIndex = 20;
		this.events();
	}

	events() {

		this.processScrollEvent = (e) => {
			e.preventDefault();
			console.log("PROCESSING SCROLL");
			if (this.working) return;

			this.working = true;
			if (e.deltaY < 0)
				this.updatePrevious();
			if (e.deltaY > 0)
				this.updateNext();
		}

		this.processClickEvent = (e) => {
			if (this.working)
				return;
			if (DOMUtils.hasClass(e.target, 'arrow'))
				this.processBtn(e.target);
		}

		DOMUtils.addMultiEventListener(this.dom.wrapper, 'DOMMouseScroll mousewheel', this.processScrollEvent);
		this.dom.wrapper.addEventListener('click', this.processClickEvent);
	}

	destroy() {
		if (this.working) {
			console.log("TRYING TO DESTROY BUT STILL WORKING");
			this.mustDestroy = true;
			return;
		}

		DOMUtils.removeMultiEventListener(this.dom.wrapper, 'DOMMouseScroll mousewheel', this.processScrollEvent);
		this.dom.wrapper.removeEventListener('click', this.processClickEvent);
		this.dom.slides.forEach((slide) => {
			DOMUtils.removeClass(slide, 'showing');
			Object.assign(slide.style, prefixAll({animation: '', zIndex: ''}));
		});
		DOMUtils.addClass(this.dom.slides[0], 'showing');
	}

	processBtn(btn) {
		if (this.isAuto) {
			this.isAuto = false;
			clearInterval(this.auto);
		}
		if (DOMUtils.hasClass(btn, 'next'))
			this.updateNext();
		if (DOMUtils.hasClass(btn, 'previous'))
			this.updatePrevious();
	}

	/**
	* Update next global index
	*/
	updateNext() {
		console.log("UPDATING NEXT");
		this.next = (this.current + 1) % this.length;
		this.process();
	}

	/**
	* Update next global index
	*/
	updatePrevious() {
		console.log("UPDATING PREVIOUS");
		this.next--;
		if (this.next < 0)
			this.next = this.length - 1;
		this.process();
	}

	/**
	* Process, calculate and switch between slides
	*/
	process() {
		this.dom.next = this.dom.slides[this.next];
		this.dom.current.style.zIndex = 20;
		this.dom.next.style.zIndex = 30;

		Object.assign(this.dom.current.style, prefixAll({animation: ''}));

		applyCSSAnimation(this.dom.next,
			this.dmt.animations.expandFromCenter,
			'2000ms',
			{fillMode: 'forwards'})
		.then(() => {
			console.log(this);
			this.dom.current.style.zIndex = 10;
			DOMUtils.removeClass(this.dom.current, 'showing');
			DOMUtils.addClass(this.dom.next, 'showing');
			this.dom.current = this.dom.next;
			this.current = this.next;
			this.working = false;
			console.log(this.mustDestroy);
			if (this.mustDestroy) {
				console.log("HELLOO");
				console.log(this.mustDestroy);
				this.destroy();
			}
		});
	}
}
