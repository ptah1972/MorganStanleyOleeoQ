/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Slick = window.Slick || {};

    Slick = (function() {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this, dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function(slider, i) {
                    return $('<button type="button" />').text(i + 1);
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                focusOnChange: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnFocus: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                useTransform: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                scrolling: false,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                swiping: false,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.focussed = false;
            _.interrupted = false;
            _.hidden = 'hidden';
            _.paused = true;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, settings, dataSettings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


            _.registerBreakpoints();
            _.init(true);

        }

        return Slick;

    }());

    Slick.prototype.activateADA = function() {
        var _ = this;

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });

    };

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || (index >= _.slideCount)) {
            return false;
        }

        _.unload();

        if (typeof(index) === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function(index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function(targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }

        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -(_.currentLeft);
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' +
                                now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' +
                                now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });

            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function() {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }

            }

        }

    };

    Slick.prototype.getNavTarget = function() {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if ( asNavFor && asNavFor !== null ) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        return asNavFor;

    };

    Slick.prototype.asNavFor = function(index) {

        var _ = this,
            asNavFor = _.getNavTarget();

        if ( asNavFor !== null && typeof asNavFor === 'object' ) {
            asNavFor.each(function() {
                var target = $(this).slick('getSlick');
                if(!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }

    };

    Slick.prototype.applyTransition = function(slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.autoPlay = function() {

        var _ = this;

        _.autoPlayClear();

        if ( _.slideCount > _.options.slidesToShow ) {
            _.autoPlayTimer = setInterval( _.autoPlayIterator, _.options.autoplaySpeed );
        }

    };

    Slick.prototype.autoPlayClear = function() {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

    };

    Slick.prototype.autoPlayIterator = function() {

        var _ = this,
            slideTo = _.currentSlide + _.options.slidesToScroll;

        if ( !_.paused && !_.interrupted && !_.focussed ) {

            if ( _.options.infinite === false ) {

                if ( _.direction === 1 && ( _.currentSlide + 1 ) === ( _.slideCount - 1 )) {
                    _.direction = 0;
                }

                else if ( _.direction === 0 ) {

                    slideTo = _.currentSlide - _.options.slidesToScroll;

                    if ( _.currentSlide - 1 === 0 ) {
                        _.direction = 1;
                    }

                }

            }

            _.slideHandler( slideTo );

        }

    };

    Slick.prototype.buildArrows = function() {

        var _ = this;

        if (_.options.arrows === true ) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if( _.slideCount > _.options.slidesToShow ) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow
                        .addClass('slick-disabled')
                        .attr('aria-disabled', 'true');
                }

            } else {

                _.$prevArrow.add( _.$nextArrow )

                    .addClass('slick-hidden')
                    .attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });

            }

        }

    };

    Slick.prototype.buildDots = function() {

        var _ = this,
            i, dot;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$slider.addClass('slick-dotted');

            dot = $('<ul />').addClass(_.options.dotsClass);

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
            }

            _.$dots = dot.appendTo(_.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active');

        }

    };

    Slick.prototype.buildOut = function() {

        var _ = this;

        _.$slides =
            _.$slider
                .children( _.options.slide + ':not(.slick-cloned)')
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function(index, element) {
            $(element)
                .attr('data-slick-index', index)
                .data('originalStyling', $(element).attr('style') || '');
        });

        _.$slider.addClass('slick-slider');

        _.$slideTrack = (_.slideCount === 0) ?
            $('<div class="slick-track"/>').appendTo(_.$slider) :
            _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap(
            '<div class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();


        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }

    };

    Slick.prototype.buildRows = function() {

        var _ = this, a, b, c, newSlides, numOfSlides, originalSlides,slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if(_.options.rows > 0) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(
                originalSlides.length / slidesPerSection
            );

            for(a = 0; a < numOfSlides; a++){
                var slide = document.createElement('div');
                for(b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for(c = 0; c < _.options.slidesPerRow; c++) {
                        var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.empty().append(newSlides);
            _.$slider.children().children().children()
                .css({
                    'width':(100 / _.options.slidesPerRow) + '%',
                    'display': 'inline-block'
                });

        }

    };

    Slick.prototype.checkResponsive = function(initial, forceUpdate) {

        var _ = this,
            breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if ( _.options.responsive &&
            _.options.responsive.length &&
            _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint =
                            targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings,
                                _.breakpointSettings[
                                    targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings,
                            _.breakpointSettings[
                                targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if( !initial && triggerBreakpoint !== false ) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }

    };

    Slick.prototype.changeSlide = function(event, dontAnimate) {

        var _ = this,
            $target = $(event.currentTarget),
            indexOffset, slideOffset, unevenOffset;

        // If target is a link, prevent default action.
        if($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if(!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 :
                    event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }

    };

    Slick.prototype.checkNavigable = function(index) {

        var _ = this,
            navigables, prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function() {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots)
                .off('click.slick', _.changeSlide)
                .off('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .off('mouseleave.slick', $.proxy(_.interrupt, _, false));

            if (_.options.accessibility === true) {
                _.$dots.off('keydown.slick', _.keyHandler);
            }
        }

        _.$slider.off('focus.slick blur.slick');

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
                _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
            }
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.cleanUpSlideEvents();

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);

    };

    Slick.prototype.cleanUpSlideEvents = function() {

        var _ = this;

        _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));

    };

    Slick.prototype.cleanUpRows = function() {

        var _ = this, originalSlides;

        if(_.options.rows > 0) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.empty().append(originalSlides);
        }

    };

    Slick.prototype.clickHandler = function(event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    };

    Slick.prototype.destroy = function(refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if ( _.$prevArrow && _.$prevArrow.length ) {

            _.$prevArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.prevArrow )) {
                _.$prevArrow.remove();
            }
        }

        if ( _.$nextArrow && _.$nextArrow.length ) {

            _.$nextArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.nextArrow )) {
                _.$nextArrow.remove();
            }
        }


        if (_.$slides) {

            _.$slides
                .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
                .removeAttr('aria-hidden')
                .removeAttr('data-slick-index')
                .each(function(){
                    $(this).attr('style', $(this).data('originalStyling'));
                });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');
        _.$slider.removeClass('slick-dotted');

        _.unslicked = true;

        if(!refresh) {
            _.$slider.trigger('destroy', [_]);
        }

    };

    Slick.prototype.disableTransition = function(slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.fadeSlide = function(slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function() {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }

        }

    };

    Slick.prototype.fadeSlideOut = function(slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });

        }

    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

        var _ = this;

        if (filter !== null) {

            _.$slidesCache = _.$slides;

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.focusHandler = function() {

        var _ = this;

        _.$slider
            .off('focus.slick blur.slick')
            .on('focus.slick blur.slick', '*', function(event) {

            event.stopImmediatePropagation();
            var $sf = $(this);

            setTimeout(function() {

                if( _.options.pauseOnFocus ) {
                    _.focussed = $sf.is(':focus');
                    _.autoPlay();
                }

            }, 0);

        });
    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

        var _ = this;
        return _.currentSlide;

    };

    Slick.prototype.getDotCount = function() {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            if (_.slideCount <= _.options.slidesToShow) {
                 ++pagerQty;
            } else {
                while (breakPoint < _.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + _.options.slidesToScroll;
                    counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
                }
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else if(!_.options.asNavFor) {
            pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
        }else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToScroll;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;

    };

    Slick.prototype.getLeft = function(slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide,
            coef;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
                coef = -1

                if (_.options.vertical === true && _.options.centerMode === true) {
                    if (_.options.slidesToShow === 2) {
                        coef = -1.5;
                    } else if (_.options.slidesToShow === 1) {
                        coef = -2
                    }
                }
                verticalOffset = (verticalHeight * _.options.slidesToShow) * coef;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
                        verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
                    } else {
                        _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
                        verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
                verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
            _.slideOffset = ((_.slideWidth * Math.floor(_.options.slidesToShow)) / 2) - ((_.slideWidth * _.slideCount) / 2);
        } else if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
        } else {
            targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            if (_.options.rtl === true) {
                if (targetSlide[0]) {
                    targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                } else {
                    targetLeft =  0;
                }
            } else {
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            }

            if (_.options.centerMode === true) {
                if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }

                if (_.options.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft =  0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;

    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

        var _ = this;

        return _.options[option];

    };

    Slick.prototype.getNavigableIndexes = function() {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;

    };

    Slick.prototype.getSlick = function() {

        return this;

    };

    Slick.prototype.getSlideCount = function() {

        var _ = this,
            slidesTraversed, swipedSlide, centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;

        } else {
            return _.options.slidesToScroll;
        }

    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);

    };

    Slick.prototype.init = function(creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
            _.checkResponsive(true);
            _.focusHandler();

        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

        if ( _.options.autoplay ) {

            _.paused = false;
            _.autoPlay();

        }

    };

    Slick.prototype.initADA = function() {
        var _ = this,
                numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
                tabControlIndexes = _.getNavigableIndexes().filter(function(val) {
                    return (val >= 0) && (val < _.slideCount);
                });

        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        if (_.$dots !== null) {
            _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
                var slideControlIndex = tabControlIndexes.indexOf(i);

                $(this).attr({
                    'role': 'tabpanel',
                    'id': 'slick-slide' + _.instanceUid + i,
                    'tabindex': -1
                });

                if (slideControlIndex !== -1) {
                   var ariaButtonControl = 'slick-slide-control' + _.instanceUid + slideControlIndex
                   if ($('#' + ariaButtonControl).length) {
                     $(this).attr({
                         'aria-describedby': ariaButtonControl
                     });
                   }
                }
            });

            _.$dots.attr('role', 'tablist').find('li').each(function(i) {
                var mappedSlideIndex = tabControlIndexes[i];

                $(this).attr({
                    'role': 'presentation'
                });

                $(this).find('button').first().attr({
                    'role': 'tab',
                    'id': 'slick-slide-control' + _.instanceUid + i,
                    'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
                    'aria-label': (i + 1) + ' of ' + numDotGroups,
                    'aria-selected': null,
                    'tabindex': '-1'
                });

            }).eq(_.currentSlide).find('button').attr({
                'aria-selected': 'true',
                'tabindex': '0'
            }).end();
        }

        for (var i=_.currentSlide, max=i+_.options.slidesToShow; i < max; i++) {
          if (_.options.focusOnChange) {
            _.$slides.eq(i).attr({'tabindex': '0'});
          } else {
            _.$slides.eq(i).removeAttr('tabindex');
          }
        }

        _.activateADA();

    };

    Slick.prototype.initArrowEvents = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'previous'
               }, _.changeSlide);
            _.$nextArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'next'
               }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow.on('keydown.slick', _.keyHandler);
                _.$nextArrow.on('keydown.slick', _.keyHandler);
            }
        }

    };

    Slick.prototype.initDotEvents = function() {

        var _ = this;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$dots.on('keydown.slick', _.keyHandler);
            }
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.slideCount > _.options.slidesToShow) {

            $('li', _.$dots)
                .on('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initSlideEvents = function() {

        var _ = this;

        if ( _.options.pauseOnHover ) {

            _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
            _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initializeEvents = function() {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();
        _.initSlideEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(_.setPosition);

    };

    Slick.prototype.initUI = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();

        }

    };

    Slick.prototype.keyHandler = function(event) {

        var _ = this;
         //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if(!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'next' :  'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'previous' : 'next'
                    }
                });
            }
        }

    };

    Slick.prototype.lazyLoad = function() {

        var _ = this,
            loadRange, cloneRange, rangeStart, rangeEnd;

        function loadImages(imagesScope) {

            $('img[data-lazy]', imagesScope).each(function() {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageSrcSet = $(this).attr('data-srcset'),
                    imageSizes  = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    image
                        .animate({ opacity: 0 }, 100, function() {

                            if (imageSrcSet) {
                                image
                                    .attr('srcset', imageSrcSet );

                                if (imageSizes) {
                                    image
                                        .attr('sizes', imageSizes );
                                }
                            }

                            image
                                .attr('src', imageSource)
                                .animate({ opacity: 1 }, 200, function() {
                                    image
                                        .removeAttr('data-lazy data-srcset data-sizes')
                                        .removeClass('slick-loading');
                                });
                            _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                        });

                };

                imageToLoad.onerror = function() {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                };

                imageToLoad.src = imageSource;

            });

        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

        if (_.options.lazyLoad === 'anticipated') {
            var prevSlide = rangeStart - 1,
                nextSlide = rangeEnd,
                $slides = _.$slider.find('.slick-slide');

            for (var i = 0; i < _.options.slidesToScroll; i++) {
                if (prevSlide < 0) prevSlide = _.slideCount - 1;
                loadRange = loadRange.add($slides.eq(prevSlide));
                loadRange = loadRange.add($slides.eq(nextSlide));
                prevSlide--;
                nextSlide++;
            }
        }

        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else
        if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }

    };

    Slick.prototype.loadSlider = function() {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }

    };

    Slick.prototype.next = Slick.prototype.slickNext = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });

    };

    Slick.prototype.orientationChange = function() {

        var _ = this;

        _.checkResponsive();
        _.setPosition();

    };

    Slick.prototype.pause = Slick.prototype.slickPause = function() {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;

    };

    Slick.prototype.play = Slick.prototype.slickPlay = function() {

        var _ = this;

        _.autoPlay();
        _.options.autoplay = true;
        _.paused = false;
        _.focussed = false;
        _.interrupted = false;

    };

    Slick.prototype.postSlide = function(index) {

        var _ = this;

        if( !_.unslicked ) {

            _.$slider.trigger('afterChange', [_, index]);

            _.animating = false;

            if (_.slideCount > _.options.slidesToShow) {
                _.setPosition();
            }

            _.swipeLeft = null;

            if ( _.options.autoplay ) {
                _.autoPlay();
            }

            if (_.options.accessibility === true) {
                _.initADA();

                if (_.options.focusOnChange) {
                    var $currentSlide = $(_.$slides.get(_.currentSlide));
                    $currentSlide.attr('tabindex', 0).focus();
                }
            }

        }

    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });

    };

    Slick.prototype.preventDefault = function(event) {

        event.preventDefault();

    };

    Slick.prototype.progressiveLazyLoad = function( tryCount ) {

        tryCount = tryCount || 1;

        var _ = this,
            $imgsToLoad = $( 'img[data-lazy]', _.$slider ),
            image,
            imageSource,
            imageSrcSet,
            imageSizes,
            imageToLoad;

        if ( $imgsToLoad.length ) {

            image = $imgsToLoad.first();
            imageSource = image.attr('data-lazy');
            imageSrcSet = image.attr('data-srcset');
            imageSizes  = image.attr('data-sizes') || _.$slider.attr('data-sizes');
            imageToLoad = document.createElement('img');

            imageToLoad.onload = function() {

                if (imageSrcSet) {
                    image
                        .attr('srcset', imageSrcSet );

                    if (imageSizes) {
                        image
                            .attr('sizes', imageSizes );
                    }
                }

                image
                    .attr( 'src', imageSource )
                    .removeAttr('data-lazy data-srcset data-sizes')
                    .removeClass('slick-loading');

                if ( _.options.adaptiveHeight === true ) {
                    _.setPosition();
                }

                _.$slider.trigger('lazyLoaded', [ _, image, imageSource ]);
                _.progressiveLazyLoad();

            };

            imageToLoad.onerror = function() {

                if ( tryCount < 3 ) {

                    /**
                     * try to load the image 3 times,
                     * leave a slight delay so we don't get
                     * servers blocking the request.
                     */
                    setTimeout( function() {
                        _.progressiveLazyLoad( tryCount + 1 );
                    }, 500 );

                } else {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                    _.progressiveLazyLoad();

                }

            };

            imageToLoad.src = imageSource;

        } else {

            _.$slider.trigger('allImagesLoaded', [ _ ]);

        }

    };

    Slick.prototype.refresh = function( initializing ) {

        var _ = this, currentSlide, lastVisibleIndex;

        lastVisibleIndex = _.slideCount - _.options.slidesToShow;

        // in non-infinite sliders, we don't want to go past the
        // last visible index.
        if( !_.options.infinite && ( _.currentSlide > lastVisibleIndex )) {
            _.currentSlide = lastVisibleIndex;
        }

        // if less slides than to show, go to start.
        if ( _.slideCount <= _.options.slidesToShow ) {
            _.currentSlide = 0;

        }

        currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if( !initializing ) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);

        }

    };

    Slick.prototype.registerBreakpoints = function() {

        var _ = this, breakpoint, currentBreakpoint, l,
            responsiveSettings = _.options.responsive || null;

        if ( $.type(responsiveSettings) === 'array' && responsiveSettings.length ) {

            _.respondTo = _.options.respondTo || 'window';

            for ( breakpoint in responsiveSettings ) {

                l = _.breakpoints.length-1;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while( l >= 0 ) {
                        if( _.breakpoints[l] && _.breakpoints[l] === currentBreakpoint ) {
                            _.breakpoints.splice(l,1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

                }

            }

            _.breakpoints.sort(function(a, b) {
                return ( _.options.mobileFirst ) ? a-b : b-a;
            });

        }

    };

    Slick.prototype.reinit = function() {

        var _ = this;

        _.$slides =
            _.$slideTrack
                .children(_.options.slide)
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.cleanUpSlideEvents();
        _.initSlideEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        _.setPosition();
        _.focusHandler();

        _.paused = !_.options.autoplay;
        _.autoPlay();

        _.$slider.trigger('reInit', [_]);

    };

    Slick.prototype.resize = function() {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if( !_.unslicked ) { _.setPosition(); }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.setCSS = function(position) {

        var _ = this,
            positionProps = {},
            x, y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }

    };

    Slick.prototype.setDimensions = function() {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: ('0px ' + _.options.centerPadding)
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: (_.options.centerPadding + ' 0px')
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();


        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

    };

    Slick.prototype.setFade = function() {

        var _ = this,
            targetLeft;

        _.$slides.each(function(index, element) {
            targetLeft = (_.slideWidth * index) * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });

    };

    Slick.prototype.setHeight = function() {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }

    };

    Slick.prototype.setOption =
    Slick.prototype.slickSetOption = function() {

        /**
         * accepts arguments in format of:
         *
         *  - for changing a single option's value:
         *     .slick("setOption", option, value, refresh )
         *
         *  - for changing a set of responsive options:
         *     .slick("setOption", 'responsive', [{}, ...], refresh )
         *
         *  - for updating multiple values at once (not responsive)
         *     .slick("setOption", { 'option': value, ... }, refresh )
         */

        var _ = this, l, item, option, value, refresh = false, type;

        if( $.type( arguments[0] ) === 'object' ) {

            option =  arguments[0];
            refresh = arguments[1];
            type = 'multiple';

        } else if ( $.type( arguments[0] ) === 'string' ) {

            option =  arguments[0];
            value = arguments[1];
            refresh = arguments[2];

            if ( arguments[0] === 'responsive' && $.type( arguments[1] ) === 'array' ) {

                type = 'responsive';

            } else if ( typeof arguments[1] !== 'undefined' ) {

                type = 'single';

            }

        }

        if ( type === 'single' ) {

            _.options[option] = value;


        } else if ( type === 'multiple' ) {

            $.each( option , function( opt, val ) {

                _.options[opt] = val;

            });


        } else if ( type === 'responsive' ) {

            for ( item in value ) {

                if( $.type( _.options.responsive ) !== 'array' ) {

                    _.options.responsive = [ value[item] ];

                } else {

                    l = _.options.responsive.length-1;

                    // loop through the responsive object and splice out duplicates.
                    while( l >= 0 ) {

                        if( _.options.responsive[l].breakpoint === value[item].breakpoint ) {

                            _.options.responsive.splice(l,1);

                        }

                        l--;

                    }

                    _.options.responsive.push( value[item] );

                }

            }

        }

        if ( refresh ) {

            _.unload();
            _.reinit();

        }

    };

    Slick.prototype.setPosition = function() {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);

    };

    Slick.prototype.setProps = function() {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined ||
            bodyStyle.MozTransition !== undefined ||
            bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if ( _.options.fade ) {
            if ( typeof _.options.zIndex === 'number' ) {
                if( _.options.zIndex < 3 ) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = _.options.useTransform && (_.animType !== null && _.animType !== false);
    };


    Slick.prototype.setSlideClasses = function(index) {

        var _ = this,
            centerOffset, allSlides, indexOffset, remainder;

        allSlides = _.$slider
            .find('.slick-slide')
            .removeClass('slick-active slick-center slick-current')
            .attr('aria-hidden', 'true');

        _.$slides
            .eq(index)
            .addClass('slick-current');

        if (_.options.centerMode === true) {

            var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {
                    _.$slides
                        .slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides
                        .slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

                if (index === 0) {

                    allSlides
                        .eq(allSlides.length - 1 - _.options.slidesToShow)
                        .addClass('slick-center');

                } else if (index === _.slideCount - 1) {

                    allSlides
                        .eq(_.options.slidesToShow)
                        .addClass('slick-center');

                }

            }

            _.$slides
                .eq(index)
                .addClass('slick-center');

        } else {

            if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

                _.$slides
                    .slice(index, index + _.options.slidesToShow)
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

                    allSlides
                        .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    allSlides
                        .slice(indexOffset, indexOffset + _.options.slidesToShow)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

            }

        }

        if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
            _.lazyLoad();
        }
    };

    Slick.prototype.setupInfinite = function() {

        var _ = this,
            i, slideIndex, infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > (_.slideCount -
                        infiniteCount); i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex - _.slideCount)
                        .prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount  + _.slideCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex + _.slideCount)
                        .appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
                    $(this).attr('id', '');
                });

            }

        }

    };

    Slick.prototype.interrupt = function( toggle ) {

        var _ = this;

        if( !toggle ) {
            _.autoPlay();
        }
        _.interrupted = toggle;

    };

    Slick.prototype.selectHandler = function(event) {

        var _ = this;

        var targetElement =
            $(event.target).is('.slick-slide') ?
                $(event.target) :
                $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.slideHandler(index, false, true);
            return;

        }

        _.slideHandler(index);

    };

    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
            _ = this, navTarget;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if ( _.options.autoplay ) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        if ( _.options.asNavFor ) {

            navTarget = _.getNavTarget();
            navTarget = navTarget.slick('getSlick');

            if ( navTarget.slideCount <= navTarget.options.slidesToShow ) {
                navTarget.setSlideClasses(_.currentSlide);
            }

        }

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });

            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }

    };

    Slick.prototype.startLoad = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();

        }

        _.$slider.addClass('slick-loading');

    };

    Slick.prototype.swipeDirection = function() {

        var xDist, yDist, r, swipeAngle, _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return (_.options.rtl === false ? 'right' : 'left');
        }
        if (_.options.verticalSwiping === true) {
            if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
                return 'down';
            } else {
                return 'up';
            }
        }

        return 'vertical';

    };

    Slick.prototype.swipeEnd = function(event) {

        var _ = this,
            slideCount,
            direction;

        _.dragging = false;
        _.swiping = false;

        if (_.scrolling) {
            _.scrolling = false;
            return false;
        }

        _.interrupted = false;
        _.shouldClick = ( _.touchObject.swipeLength > 10 ) ? false : true;

        if ( _.touchObject.curX === undefined ) {
            return false;
        }

        if ( _.touchObject.edgeHit === true ) {
            _.$slider.trigger('edge', [_, _.swipeDirection() ]);
        }

        if ( _.touchObject.swipeLength >= _.touchObject.minSwipe ) {

            direction = _.swipeDirection();

            switch ( direction ) {

                case 'left':
                case 'down':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide + _.getSlideCount() ) :
                            _.currentSlide + _.getSlideCount();

                    _.currentDirection = 0;

                    break;

                case 'right':
                case 'up':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide - _.getSlideCount() ) :
                            _.currentSlide - _.getSlideCount();

                    _.currentDirection = 1;

                    break;

                default:


            }

            if( direction != 'vertical' ) {

                _.slideHandler( slideCount );
                _.touchObject = {};
                _.$slider.trigger('swipe', [_, direction ]);

            }

        } else {

            if ( _.touchObject.startX !== _.touchObject.curX ) {

                _.slideHandler( _.currentSlide );
                _.touchObject = {};

            }

        }

    };

    Slick.prototype.swipeHandler = function(event) {

        var _ = this;

        if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
            event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options
            .touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options
                .touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }

    };

    Slick.prototype.swipeMove = function(event) {

        var _ = this,
            edgeWasHit = false,
            curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        verticalSwipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

        if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
            _.scrolling = true;
            return false;
        }

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = verticalSwipeLength;
        }

        swipeDirection = _.swipeDirection();

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            _.swiping = true;
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }


        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);

    };

    Slick.prototype.swipeStart = function(event) {

        var _ = this,
            touches;

        _.interrupted = true;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;

    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.unload = function() {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides
            .removeClass('slick-slide slick-active slick-visible slick-current')
            .attr('aria-hidden', 'true')
            .css('width', '');

    };

    Slick.prototype.unslick = function(fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();

    };

    Slick.prototype.updateArrows = function() {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if ( _.options.arrows === true &&
            _.slideCount > _.options.slidesToShow &&
            !_.options.infinite ) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            }

        }

    };

    Slick.prototype.updateDots = function() {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots
                .find('li')
                    .removeClass('slick-active')
                    .end();

            _.$dots
                .find('li')
                .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
                .addClass('slick-active');

        }

    };

    Slick.prototype.visibility = function() {

        var _ = this;

        if ( _.options.autoplay ) {

            if ( document[_.hidden] ) {

                _.interrupted = true;

            } else {

                _.interrupted = false;

            }

        }

    };

    $.fn.slick = function() {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                _[i].slick = new Slick(_[i], opt);
            else
                ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };

}));

/*
 *  Copyright 2018 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
/* modified from html5up.net thanks @ajlkn */
(function($) {

    /**
     * Panel-ify an element.
     * @param {object} userConfig User config.
     * @return {jQuery} jQuery object.
     */
    $.fn.panel = function(userConfig) {

        // No elements?
            if (this.length == 0)
                return $this;

        // Multiple elements?
            if (this.length > 1) {

                for (var i=0; i < this.length; i++)
                    $(this[i]).panel(userConfig);

                return $this;
            }

        // Vars.
            var $this = $(this),
                $body = $('body'),
                $window = $(window),
                id = $this.attr('id'),
                config;

        // Config.
            config = $.extend({

                // Delay.
                    delay: 0,

                // Hide panel on link click.
                    hideOnClick: false,

                // Hide panel on escape keypress.
                    hideOnEscape: false,

                // Hide panel on swipe.
                    hideOnSwipe: false,

                // Reset scroll position on hide.
                    resetScroll: false,

                // Reset forms on hide.
                    resetForms: false,

                // Side of viewport the panel will appear.
                    side: null,

                // Target element for "class".
                    target: $this,

                // Class to toggle.
                    visibleClass: 'visible'

            }, userConfig);

            // Expand "target" if it's not a jQuery object already.
                if (typeof config.target != 'jQuery')
                    config.target = $(config.target);

        // PANEL.

            // Methods.
                $this._hide = function(event) {

                    // Already hidden? Bail.
                        if (!config.target.hasClass(config.visibleClass))
                            return;

                    // If an event was provided, cancel it.
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }

                    // Hide.
                        config.target.removeClass(config.visibleClass);
/**
* Flip the icon from hamburger to cross icon
*/
                         config.target.find('#toggleNav i').toggleClass('hamburger-close');
                    	 config.target.find('#toggleNav a').attr('aria-expanded', function (i, attr) {
                            return attr == 'true' ? 'false' : 'true'
                         });

                    // Post-hide stuff.
                        window.setTimeout(function() {

                            // Reset scroll position.
                                if (config.resetScroll)
                                    $this.scrollTop(0);

                            // Reset forms.
                                if (config.resetForms)
                                    $this.find('form').each(function() {
                                        this.reset();
                                    });

                        }, config.delay);

                };

            // Vendor fixes.
                $this
                    .css('-ms-overflow-style', '-ms-autohiding-scrollbar')
                    .css('-webkit-overflow-scrolling', 'touch');

            // Hide on click.
                if (config.hideOnClick) {

                    $this.find('a').css('-webkit-tap-highlight-color', 'rgba(0,0,0,0)');

/*********************************************
*  Dealing with menu item link clicks
*
*********************************************/
                    $this.on('click', 'a', function(event) {

                            var $a = $(this),
                                href = $a.attr('href'),
                                target = $a.attr('target');

                            if (!href || href == '#' || href == '' || href == '#' + id)
                                return;

                            // Cancel original event.
                                event.preventDefault();
                                event.stopPropagation();

                            // Hide panel.
                                $this._hide();

                            // Redirect to href.
                                window.setTimeout(function() {

                                    if (target == '_blank')
                                        window.open(href);
                                    else
                                        window.location.href = href;

                                }, config.delay + 10);

                        });
                }

            // Event: Touch stuff.
                $this.on('touchstart', function(event) {

                    $this.touchPosX = event.originalEvent.touches[0].pageX;
                    $this.touchPosY = event.originalEvent.touches[0].pageY;

                })

                $this.on('touchmove', function(event) {

                    if ($this.touchPosX === null
                    ||  $this.touchPosY === null)
                        return;

                    var diffX = $this.touchPosX - event.originalEvent.touches[0].pageX,
                        diffY = $this.touchPosY - event.originalEvent.touches[0].pageY,
                        th = $this.outerHeight(),
                        ts = ($this.get(0).scrollHeight - $this.scrollTop());

                    // Hide on swipe?
                        if (config.hideOnSwipe) {

                            var result = false,
                                boundary = 20,
                                delta = 50;

                            switch (config.side) {

                                case 'left':
                                    result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX > delta);
                                    break;

                                case 'right':
                                    result = (diffY < boundary && diffY > (-1 * boundary)) && (diffX < (-1 * delta));
                                    break;

                                case 'top':
                                    result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY > delta);
                                    break;

                                case 'bottom':
                                    result = (diffX < boundary && diffX > (-1 * boundary)) && (diffY < (-1 * delta));
                                    break;

                                default:
                                    break;
                            }

                            if (result) {
                                $this.touchPosX = null;
                                $this.touchPosY = null;
                                $this._hide();

                                return false;
                            }
                        }

                    // Prevent vertical scrolling past the top or bottom.
                        if (($this.scrollTop() < 0 && diffY < 0)
                        || (ts > (th - 2) && ts < (th + 2) && diffY > 0)) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                });

            // Event: Prevent certain events inside the panel from bubbling.
                $this.on('click touchend touchstart touchmove', function(event) {
                    event.stopPropagation();
                });

            // Event: Hide panel if a child anchor tag pointing to its ID is clicked.
                $this.on('click', 'a[href="#' + id + '"]', function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    config.target.removeClass(config.visibleClass);
/**
* Flip the icon from hamburger to cross icon
*/
                   config.target.find('#toggleNav i').toggleClass('hamburger-close');
                    config.target.find('#toggleNav a').attr('aria-expanded', function (i, attr) {
                            return attr == 'true' ? 'false' : 'true'
                         });

                });

/************************************************
*  Body: Events happen on html body
*
************************************************/

            // Event: Hide panel on body click/tap.
                $body.on('click touchend', function(event) {
                    $this._hide(event);

                });

            // Event: Toggle.
                $body.on('click', 'a[href="#' + id + '"]', function(event) {
                    event.preventDefault();
                    event.stopPropagation();

                    config.target.toggleClass(config.visibleClass);

/**
* Flip the icon from hamburger to cross icon
* when the Icon itself is clicked
*/

                    config.target.find('#toggleNav i').toggleClass('hamburger-close');
					config.target.find('#toggleNav a').attr('aria-expanded', function (i, attr) {
                            return attr == 'true' ? 'false' : 'true'
                         });

                });

        // Window.

            // Event: Hide on ESC.
                if (config.hideOnEscape)
                    $window.on('keydown', function(event) {
                        if (event.keyCode == 27)
                            $this._hide(event);
                    });

        return $this;
    };

})(jQuery);


function getObjectEntries (obj) {
        var ownProps = Object.keys( obj ),
            i = ownProps.length,
            resArray = new Array(i); // preallocate the Array
        while (i--)
        resArray[i] = [ownProps[i], obj[ownProps[i]]];

        return resArray;
}



function getQueryParamaters (queryPar,idSelector='ep') {
    var jsonPath = '/content/dam/msdotcom/appdata/filter-metadata-'+idSelector+'.json';
   // var jsonPath = "http://iapp283.devin3.ms.com:4564/auth/content/dam/msdotcom/appdata/filter-metadata.json"
    var jsonData;
    $.ajax({
        url: jsonPath,
        type: "GET",
        async: false,
        success: function (result) {
            jsonData = result;
        }
    });
    let entries = [];
    locations = "";
    if(typeof jsonData ===  "undefined"){
        return;
    }
    if (!Object.entries) {
        entries = getObjectEntries(queryPar);
    }else {
        entries = Object.entries(queryPar);
    }

     for (let j=0;j<entries.length;j++) {
         let value = entries[j][1];
         let type = entries[j][0];
        for(let i=0;i<value.length;i++){
            let capQuery = capitalizeFirstLetter(value[i]);
            let entries1 = []
            if (!Object.entries) {
                entries1 = getObjectEntries(jsonData);
            }else {
                entries1 = Object.entries(jsonData);
            }
         for (let k=0;k<entries1.length;k++) {
                let key = entries1[k][0];
                if(type=='region' && capQuery==key) {
                    if(locations){
                        locations = locations+';'+capQuery;
                    }else{
                        locations = capQuery
                    }
                }
                else if(type=='country'){
                    findCountry(jsonData, key, capQuery);
                }
                else if(type =='state') {
                    findState(jsonData, key, capQuery);
                }
                else if(type=='city') {
                    findCity(jsonData, key, capQuery);
                }
            }
        }
    }
    return locations;
}
function findCountry(jsonData, key, capQuery) {
    if(jsonData[key].values) {
     let filteredArray = jsonData[key].values.filter(function(o) { return o.name === capQuery});
        if(filteredArray.length>0){
            let countryName = capQuery
            let regionName = key;
            if(locations){
                locations = locations+';'+regionName+'_'+countryName
            }else{
                locations = regionName+'_'+countryName
            }
        }
    }
}

function findState(jsonData, key, capQuery) {
    for(let i=0;i<jsonData[key].values.length;i++){
        if(jsonData[key].values[i].values) {
           let filteredArray = jsonData[key].values[i].values.filter(function(o) { return o.name === capQuery});
            if(filteredArray.length>0){
                let stateName= capQuery
                let countryName = jsonData[key].values[i].name;
                let regionName = key;
                if(locations){
                    locations = locations+';'+regionName+'_'+countryName+'_'+stateName
                }else{
                    locations = regionName+'_'+countryName+'_'+stateName
                }
            }
        }
    }
}

function findCity(jsonData, key, capQuery) {
    for(let i=0;i<jsonData[key].values.length;i++){
        for(let j=0;j<jsonData[key].values[i].values.length;j++){
            if(jsonData[key].values[i].values[j].values) {
                let filteredArray = jsonData[key].values[i].values[j].values.filter(function(o) { return o.name === capQuery});
                if(filteredArray.length>0){
                    let cityName = capQuery;
                    let stateName= jsonData[key].values[i].values[j].name;
                    let countryName = jsonData[key].values[i].name;
                    let regionName = key;
                    if(locations){
                        locations = locations+';'+regionName+'_'+countryName+'_'+stateName+':'+cityName
                    }else{
                        locations = regionName+'_'+countryName+'_'+stateName+':'+cityName
                    }
                }
            }
        }
    }
}

function capitalizeFirstLetter (str) {
    //split the above string into an array of strings
    //whenever a blank space is encountered
    const arr = str.split(" ");
    //loop through each element of the array and capitalize the first letter.
    for (var i = 0; i < arr.length; i++) {
        if(arr[i]!=='of') {
            arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
        }

    }
    //Join all the elements of the array back into a string
    //using a blankspace as a separator
    const str2 = arr.join(" ");
    return str2;
}

var locations ='';

// Add new window icon for links which open in new tab/window
function newWindowLinks () {
    function addNoOpener(link) {
        let linkTypes = link.getAttribute('rel')
        if(!linkTypes) {
            link.setAttribute('rel', 'noopener');
        }
      }

      function addNewTabMessage(link) {
        if (!link.querySelector('.screen-reader-only')) {
          link.insertAdjacentHTML('beforeend', '<span class="screen-reader-only">(opens in a new tab)</span>');
        }
      }

      function addIcon(link) {


        let socialLinks = ['https://twitter.com','https://www.twitter.com/','https://www.linkedin.com','https://linkedin.com',
        'https://www.facebook.com','https://facebook.com','https://www.instagram.com','https://instagram.com',
        'https://www.youtube.com','https://youtube.com','mailto:'];
        let findType = false;

            for(let i=0;i<socialLinks.length;i++) {
                if (link.getAttribute('href')) {
                    if (link.getAttribute('href').search(socialLinks[i]) > -1) {
                        findType = true;
                    }
                }
            }

          if(!findType && !link.querySelector('picture')) {

            if(link.querySelector('.new-window-icon')) {
                link.querySelector('.new-window-icon').remove()
            }

            let newwindowiconHTML = '<span class="new-window-icon"><svg width="12px" height="13px" viewBox="0 0 12 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
            +'<title></title>'
            +'<g id="Design-System" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">'
            +' <g id="Design-system_Icons" transform="translate(-180.000000, -326.000000)" fill="'+$(link).css('color')+'" fill-rule="nonzero">'
            +'      <g id="New-Tab-Icon-Black" transform="translate(186.125000, 332.375000) rotate(-270.000000) translate(-186.125000, -332.375000) translate(180.250000, 326.500000)">'
            +'          <polygon id="Path" points="1.56666668 3.91666682 0 3.91666682 0 0 3.91666682 0 3.91666682 1.56666668 1.56666668 1.56666668"></polygon>'
            +'          <polygon id="Rectangle" transform="translate(4.308333, 4.308333) rotate(-45.000000) translate(-4.308333, -4.308333) " points="3.52508375 -0.676769414 5.09158313 -0.676769414 5.09158313 9.29343634 3.52508375 9.29343634"></polygon>'
            +'          <polygon id="Path" points="11.75 11.75 0 11.75 0 5.875 1.56666668 5.875 1.56666668 10.1833331 10.1833331 10.1833331 10.1833331 1.56666668 5.875 1.56666668 5.875 0 11.75 0"></polygon>'
            +'      </g>'
            +'  </g>'
            +'</g>'
            +'</svg></span>';
            if(link.querySelector('span') && !link.querySelector('.screen-reader-only')) {
                $(link).find('span:first').append(newwindowiconHTML)
            } else {
            link.insertAdjacentHTML('beforeend', newwindowiconHTML);
            }
          }
      }

      function changeIconColor(link) {
        $(link).find('#Design-system_Icons').css({fill:$(link).css('color')})
      }

    var forEach = function (array, callback, scope) {
        for (var i = 0; i < array.length; i++) {
          callback.call(scope, i, array[i]); // passes back stuff we need
        }
      };
      var myNodeList = document.querySelectorAll('a[target="_blank"]');
        forEach(myNodeList, function (index, link) {
            addNoOpener(link);
            $(link).hover(function(){changeIconColor(link)});
            $(link).focusout(function(){changeIconColor(link)});
            $(link).focusin(function(){changeIconColor(link)});
            addIcon(link);
            addNewTabMessage(link);
        });
}
// End of new tab icon

$( document ).ready(function() {
    newWindowLinks();
});

/**milliseconds to seconds***/
function millisToMinutesAndSeconds(millis) {

    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

var url = window.location.href;
var arr = url.split("/");
var contextPath = "/"+arr[3];
var origin = window.location.origin;

var apiPoint = "";

if(arr[3] === 'auth' || arr[3] === 'pub') {
    apiPoint = origin+contextPath;
}else{
    apiPoint = origin
}

var careerAPI = origin+"/web/career_services/webapp/service/careerservice/resultset.json?opportunity=sg&location=Americas;Europe,%20Middle%20East,%20Africa;Japan;Non-Japan%20Asia&lang=EN";
//var locationAPI = apiPoint+"/details.dynadata_locations-results.json/";
//var meettheteamAPI = apiPoint+"/details.dynadata_profiles-results.json/";
var locationAPI = apiPoint+"/content/msdotcom/en/details.dynadata_locations-results.json/";
var meettheteamAPI = apiPoint+"/content/msdotcom/en/details.dynadata_profiles-results.json/";
var locationImagePoint = apiPoint;
var meettheteamImagePoint = apiPoint;
var studentGraduatesPoint = apiPoint+"/people-opportunities/students-graduates"



// varName JS
function Pagination(varName) {
    // varName.Init(document.getElementById(Id), {
    //     size: pages, // pages size
    //     page: currentPage,  // selected page
    //     step: 1,   // pages before and after current
    //     results : resultSet, // data to show
    //     changedata : generateResult, // call back function for data change
    //     class: className
    // });
     return varName = {

        code: '',
        
        // --------------------
        // Utility
        // --------------------
        
        // converting initialize data
        Extend: function(data) {
            data = data || {};
            
            varName.size = data.size || 0;
            varName.page = data.page  || 0;
            varName.step = data.step || 3;
            varName.changedata = data.changedata;
            varName.data = data.results || [];
            varName.class = data.class
        },
        
        // add pages by number (from [s] to [f])
        Add: function(s, f) {
            for (var i = s; i < f; i++) {
                varName.code += '<a tabindex=0>' + i + '</a>';
            }
        },
        
        // add last page with separator
        Last: function() {
            varName.code += '<i>...</i><a tabindex=0>' + varName.size + '</a>';
        },
        
        // add first page with separator
        First: function() {
            varName.code += '<a tabindex="0">1</a><i>...</i>';
        },
        
        
        
        // --------------------
        // Handlers
        // --------------------
        
        // change page
        Click: function() {
            
            varName.page = +this.innerHTML;
            varName.Start();
            varName.changedata(varName.data, varName.page, enteredKeyword, "noautoselect");
        },
        
        // previous page
        Prev: function() {
            varName.page--;
            if (varName.page < 1) {
                varName.page = 1;
            }
            varName.Start();
            varName.changedata(varName.data, varName.page, enteredKeyword, "noautoselect");;
        },
            
        // next page
        Next: function() {
            varName.page++;
            if (varName.page > varName.size) {
                varName.page = varName.size;
            }
            varName.Start();
            varName.changedata(varName.data, varName.page, enteredKeyword, "noautoselect");
        },
        
        
        
        // binding pages
        Bind: function() {
            if(varName.e) {
                var a = varName.e.getElementsByTagName('a');
                for (var i = 0; i < a.length; i++) {
                    let that = a[i].innerHTML;
                    if (+a[i].innerHTML === varName.page) a[i].className = 'active';
                    a[i].addEventListener('click', varName.Click, false);
                    a[i].addEventListener('keyup', function(e){
                        if(e.keyCode === 13) {
                            varName.page = +that;
                            varName.Start();
                            varName.changedata(varName.data, varName.page, enteredKeyword, "noautoselect");
                        }
                    }, false);
                }
            }
        },
        
        // write varName
        Finish: function() {
            if(varName.e) {
               varName.e.innerHTML = varName.code;
              // $('.'+varName.class+'.varName span').append(varName.code);
                varName.code = '';
                varName.Bind();
            }
        },
        
        // find varName type
        Start: function() {
            if(varName.data.length === 0)
            return;
        
        if (varName.size < varName.step * 2 + 3) {
            varName.Add(1, varName.size + 1);
        }
        else if (varName.page < varName.step * 2 + 1) {
            varName.Add(1, varName.step * 2 + 2);
            varName.Last();
        }
        else if (varName.page > varName.size - varName.step * 2) {
            varName.First();
            varName.Add(varName.size - varName.step * 2 , varName.size + 1);
        }
        else {
            if(varName.page >  3 ) {
                varName.First();
            } else {
                varName.code += '<a tabindex="0">1</a>';
            }
            varName.Add(varName.page - varName.step, varName.page + varName.step + 1);
            if(varName.page < (varName.size - 2) ) {
                varName.Last();
            } else {
                varName.code += '<a tabindex="0">'+ varName.size +'</a>';
            }
        }
        varName.Finish();
        },
        
        
        
        // --------------------
        // Initialization
        // --------------------
        
        // binding buttons
        Buttons: function(e) {
            var nav = e.getElementsByTagName('a');
            nav[0].addEventListener('click', varName.Prev, false);
            nav[1].addEventListener('click', varName.Next, false);
            nav[0].addEventListener('keyup', function(e){
                if(e.keyCode === 13) {
                    varName.Prev();
                }
            }, false);
            nav[1].addEventListener('keyup', function(e){
                if(e.keyCode === 13) {
                    varName.Next();
                }
            }, false);
        },
        
        // create skeleton
        Create: function(e) {
            
        let showCount = varName.data.totalResults - (varName.page * 10 );
        if(showCount >= 10) {
            showCount = 10;
        }
        let disablePrev = (varName.page == 1 ? 'style="pointer-events:none;opacity:0.3"' : 'style="pointer-events:auto;cursor:pointer"');
        let disableNext = (varName.page == varName.size ? 'style="pointer-events:none;opacity:0.3"' : 'style="pointer-events:auto;cursor:pointer"');
        let tabindexPrev = (varName.page == 1 ? 'tabindex="-1"' : 'tabindex="0"' );
        let tabindexNext = (varName.page == varName.size ? 'tabindex="-1"' : 'tabindex="0"');
        var html = [
            '<a class="arrow prev" '+ tabindexPrev +' aria-label="Previous '+ 10 +' search results"'+ disablePrev + '></a>', // previous button
            '<span></span>',  // varName container
            '<a class="arrow next" '+ tabindexNext + ' aria-label="Next '+ showCount +' search results"'+ disableNext +'></a>'  // next button
        ];
        
            if(e) {
                e.innerHTML = html.join('');
                varName.e = e.getElementsByTagName('span')[0];
                varName.Buttons(e);
            }
        },
        
        // init
        Init: function(e, data, func) {
            let page = data.size === 1 ? 0 : data.size;
            if(page>1){
                varName.Extend(data);
                varName.Create(e);
                varName.Start();
            }else {
                $(varName.class+'.varName').hide();
               // $(".varName").hide();
            }
        }
    };
}

/*Bind the video schema to video*/
function appendSchemaToDiv(videoId,videoData,divToAppend,transcriptDiv){
    if(videoData === undefined) return {};
    const videoObj = JSON.parse(JSON.stringify(videoData));
    const videoTime =videoObj.length;
    const minutes = Math.floor(videoTime / 60000);
    const seconds = ((videoTime % 60000) / 1000).toFixed(0);
    const str= "PT"+ minutes + "M" + (seconds < 10 ? '0' : '') + seconds +"S";
    const videoSchema = "\"@context\": \"https://schema.org\",\n\"@type\": \"VideoObject\",\n\"name\": \"" + videoObj.name
        + "\",\n\"description\": \""  + videoObj.description
        + "\",\n\"thumbnailUrl\": \""  + videoObj.thumbnail
        + "\",\n\"uploadDate\": \""  + videoObj.publishedDate
        + "\",\n\"duration\": \""  + str
        + "\",\n\"publisher\": \n \t{\n\t\"@type\": \"Organization\",\n\t\"name\": \"Morgan Stanley\",\n\t\"logo\": \n\t\t{ \n\t\t\"@type\": \"ImageObject\",\n\t\t\"url\": \"https://www.morganstanley.com/etc/designs/msdotcom/image/mstile-310x310.png\",\n\t\t\"width\": 310,\n\t\t\"height\": 310 \n \t\t}\n\t}"
        + ",\n\"embedUrl\": \"http://players.brightcove.net/644391012001/5xC7AvkxM_default/index.html?videoId="+videoId
        + "\",\n\"transcript\": \"" + $(transcriptDiv+videoId).text()+"\"";

    $(divToAppend+videoId).text("{ \n"  + videoSchema + " \n }");
    return videoData;
}

const testSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Why Us",
    "description": "Old School Grit. New World Ideas.",
    "thumbnailUrl": "https://cf-images.us-east-1.prod.boltdns.net/v1/static/644391012001/a517c47e-ad86-43bc-adeb-5e90ababfe35/331e5ab6-84b1-4371-a6a1-363bcdcf325b/160x90/match/image.jpg",
    "uploadDate": "2023-01-20",
    "duration": "PT1M30S",
    "publisher":
        {
            "@type": "Organization",
            "name": "Morgan Stanley",
            "logo":
                {
                    "@type": "ImageObject",
                    "url": "https://www.morganstanley.com/etc/designs/msdotcom/image/mstile-310x310.png",
                    "width": 310,
                    "height": 310
                }
        },
    "embedUrl": "http://players.brightcove.net/644391012001/5xC7AvkxM_default/index.html?videoId=6318965509112",
    "transcript": ""
};

/*Make ajax call to fetch video schema*/
function getVideoSchema(videoId,divToAppend,transcriptDiv) {
    let videoData;
    if((MSCOM.pageData !== undefined && (MSCOM.pageData.isLocal || MSCOM.pageData.isAuthorServer)) || videoId === undefined ) {
        $(divToAppend+videoId).text(JSON.stringify(testSchema));
        return JSON.parse(JSON.stringify(testSchema));
    }
    $.ajax({
        headers: {
            Accept: pk = "BCpkADawqM3r0KvGIw4rs9HAekOj_Tbekd80mVyJKY1Nb33Wv6n1XYYlJNx5yPbqm2VOS41Tu0RcWm1YgQ-VoqHH0b4OWjGYlOOhm7-uJVDx79VGDBYlWGcsjbs"
        },
        contentType: "application/json",
        crossDomain: true,
        url: encodeURI(window.location.origin + '/video.dynadata_brightcove_video_info-results.json?videoId=' + videoId),
        async: false,
        dataType: "json",
        success: function (result) {
            if(result === undefined) return {};
            videoData = JSON.parse(JSON.stringify(result));
        }
    });
    return appendSchemaToDiv(videoId,videoData,divToAppend,transcriptDiv);;
}

/**
 * Returns a ISO8601 formatted duration which is required for
 * schema.org `VideoObject`'s `duration` property
 * P<date>T<time>, e.g. PT0M30S
 * 
 * @param {number} duration - duration in seconds, from Brightcove player's player.mediainfo.duration
 */
function getISO8601Duration(duration) {
    duration = Math.floor(duration)
    const hours = duration > 3600 ? Math.floor(duration / 3600) : 0
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = (duration % 3600) % 60
    return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}${seconds}S`
}

/**
 * Generates schema.org Type of AudioObject OR VideoObject
 * 
 * @param {object} mediadata - Brightcove player's player.mediainfo object
 * @param {('AudioObject'|VideoObject)} mediatype - the appropriate schema.org MediaObject type
 */
function createMediaSchema(mediadata, mediatype, transcript) {
    return `
{
    "@context": "https://schema.org",
    "@type": "${mediatype}",
    "name": "${mediadata.name}",
    "description": "${mediadata.description}",
    "thumbnailUrl": "${mediadata.thumbnail}",
    "uploadDate": "${mediadata.updatedAt}",
    "duration": "${getISO8601Duration(mediadata.duration)}",
    "publisher": 
            {
        "@type": "Organization",
        "name": "Morgan Stanley",
        "logo": 
            { 
            "@type": "ImageObject",
            "url": "https://www.morganstanley.com/etc/designs/msdotcom/image/mstile-310x310.png",
            "width": 310,
            "height": 310 
                }
        },
    "embedUrl": "http://players.brightcove.net/644391012001/5xC7AvkxM_default/index.html?videoId=${mediadata.id}",
    "transcript": "${transcript}"
}`}

function insertMediaSchema(schema, containerElement) {
    containerElement.insertAdjacentHTML('beforeend', schema)
}


$(document).ready(function () {
    const mediaPlayerSelector = '.cmp-mediaplayer'
    const playerElements = document.querySelectorAll(mediaPlayerSelector)

    class MediaPlayer {
        constructor(domElement) {
            // get basic DOM
            this.rootElement = domElement;
            this.playButton = this.rootElement.querySelector(`${mediaPlayerSelector}__play`);
            this.playElement = this.rootElement.querySelector('[data-mediaplayer-play]');
            this.modal = this.rootElement.querySelector(`${mediaPlayerSelector}__modal`);
            this.modalCloseButton = this.rootElement.querySelector(`${mediaPlayerSelector}__close`);
            this.transcriptContainerElement = this.rootElement.querySelector(`${mediaPlayerSelector}__transcript`);
            this.schemaContainerElement = this.rootElement.querySelector(`${mediaPlayerSelector}__schema`);
            this.durationElement = this.rootElement.querySelector(`${mediaPlayerSelector}__duration`);
            this.posterElement = this.rootElement.querySelector(`${mediaPlayerSelector}__poster`);
            // setup a flag for metadata availability
            this.hasMetadataUsed = false;
            // get player config attributes from the DOM
            this.type = this.rootElement.dataset.mediaplayerType;
            // create base for custom errors
            this.error = new Error();
            this.error.name = 'MediaPlayerError'
            // initiate BC player instance
            this.player = videojs(this.rootElement.querySelector('video-js'));
            // config player options here
            this.player.fluid(true);

            this.player.ready(() => {
                /* player is ready */
                console.log(`Player ${this.player.id_} is ready`, this.player)
                if (this.testMetadata(this.player.mediainfo) && !this.hasMetadataUsed) this.insertMetadata(`insertMetadata in Player ${this.player.id_} runs on 'ready', w/ following metadata:`, this.player.mediainfo)
                /* create & emit 'ready' custom event
                 * usage: access player instance in another component once it is ready:
                 * document.addEventListener('mediaplayer-ready', event => videojs.getPlayer(event.detail.id) */
                this.rootElement.dispatchEvent(
                    new CustomEvent('mediaplayer-ready', { bubbles: true, detail: {id: this.player.id_} })
                );

                /* player metadata is loaded; at this time, the player markup is already populated inside <video-js> */
                this.player.on('loadedmetadata', () => {
                    console.log(`Player ${this.player.id_}'s 'loadedmetadata' event`)
                    // if metadata has still not get and processed on 'ready' event, try again
                    if (this.testMetadata(this.player.mediainfo) && !this.hasMetadataUsed) this.insertMetadata(`insertMetadata in Player ${this.player.id_} runs on 'loadedmetadata', w/ following metadata:`, this.player.mediainfo);
                    /* create & emit 'ready' custom event */
                    this.rootElement.dispatchEvent(
                        new CustomEvent('mediaplayer-loaded', { bubbles: true, detail: {id: this.player.id_} })
                    );
                })
                /* setup a timer as a safety backup for inserting metadata if data extraction wasn't successful until this point */
                this.timeoutID = setTimeout(() => {
                    console.log(`Attempt metadata extraction of Player ${this.player.id_} on timeout`, this.player); 
                    if (this.testMetadata(this.player.mediainfo) && !this.hasMetadataUsed) this.insertMetadata(`insertMetadata in Player ${this.player.id_} runs after timeout, ww/ following metadata:`, this.player.mediainfo);
                }, 5000);

                this.player.on('loadstart', () => {
                    console.log(`Player ${this.player.id_}'s 'loadstart' event`)
                    /* create & emit 'loadstart' custom event */
                    this.rootElement.dispatchEvent(
                        new CustomEvent('mediaplayer-loadstart', { bubbles: true, detail: {id: this.player.id_} })
                    );
                })

                /* player has started playing */
                this.player.on('play', () => {
                    if (this.rootElement.getAttribute('data-mediaplayer-ended')) {
                        this.rootElement.setAttribute('data-mediaplayer-ended', false)
                    }
                    this.rootElement.setAttribute('data-mediaplayer-paused', false)
                    /* create & emit 'play' custom event */
                    this.rootElement.dispatchEvent(
                        new CustomEvent('mediaplayer-play', { bubbles: true, detail: {id: this.player.id_} })
                    );
                })
                /* player has paused */
                this.player.on('pause', () => {
                    this.rootElement.setAttribute('data-mediaplayer-paused', true)
                    /* create & emit a custom event for playback pause */
                    this.rootElement.dispatchEvent(
                        new CustomEvent('mediaplayer-pause', { bubbles: true, detail: {element: this.player.el_, id: this.player.id_} })
                    );
                })
                /* player has ended playback */
                this.player.on('ended', () => {
                    this.rootElement.setAttribute('data-mediaplayer-ended', true)
                    /* create & emit 'ended' custom event */
                    this.rootElement.dispatchEvent(
                        new CustomEvent('mediaplayer-ended', { bubbles: true, detail: {id: this.player.id_} })
                    );
                })

                /* custom error */
                if (!this.type) {
                    this.error.message = 'Player type should be specified. Add "video" or "audio" value to the `data-mediaplayer-type` attribute on player\'s rootElement'
                    throw this.error
                }
            });
            /* add event listeners */
            /* play button */
            if (this.playButton) {
                this.playButton.addEventListener('click', this.playMedia)
            }
            /* a play button alternative, it can be any element having the `data-mediaplayer-play` attribute */
            if (this.playElement) {
                this.playElement.addEventListener('click', this.playMedia)
            }

            /* modal */
            if (this.modal) {
                // get elements for focus trap
                this.modal.firstFocusableElement = this.modalCloseButton
                this.modal.focusableElements = Array.from(this.modal.querySelectorAll('.vjs-control-bar .vjs-control:not([disabled])'))
                this.modal.lastFocusableElement = this.modal.focusableElements[this.modal.focusableElements.length - 1]
                // buttons
                this.modalCloseButton.addEventListener('click', this.pauseMedia)
                this.modal.addEventListener('click', this.closeModalOnBackdropClick)
                // pause on close event
                this.modal.addEventListener('close', this.pauseMedia)
                this.modal.addEventListener('keydown', this.trapFocus)
            }
        }
        testMetadata = data => {
            const propertiesToTest = ['name', 'duration', 'poster'];
            return propertiesToTest.every(property => property in data)
        }
        // process & insert metadata entries
        insertMetadata = (debugMsg, data) => {
            // console.log(`Metadata extraction of Player ${this.player.id_} started`)
            console.log(debugMsg, data)
            // do metadata insertion only if required container elements are present in the DOM
            if (this.schemaContainerElement && this.transcriptContainerElement) {
                this.schemaText = createMediaSchema(this.player.mediainfo, this.type, this.transcriptContainerElement.textContent);
                insertMediaSchema(this.schemaText, this.schemaContainerElement);
            }
            if (this.durationElement) {
                this.durationElement.textContent = millisToMinutesAndSeconds(this.player.mediainfo.duration * 1000)
            }
            if (this.posterElement && this.posterElement.tagName === 'IMG') {
                this.posterElement.setAttribute('src', this.player.mediainfo.poster)
            }
            this.hasMetadataUsed = true;
            clearTimeout(this.timeoutID)
        }
        /* playback related methods */
        playMedia = event => {
            if (this.modal) {
                this.modal.showModal()
            }
            this.player.play()

        }
        pauseMedia = event => {
            if (this.modal) {
                this.modal.close()
            }
            this.player.pause()
        }
        handlePlayClick = () => {
            if (this.player.paused()) {
                this.playMedia()
            } else {
                this.pauseMedia()
            }
        }
        /* modal related methods */
        closeModalOnBackdropClick = event => {
            if (event.target.nodeName === 'DIALOG')
                this.pauseMedia()
        }
        trapFocus = event => {
            if (event.key !== 'Tab') return
            if (event.shiftKey) { // shift + tab
                if (document.activeElement === this.modal.firstFocusableElement) {
                    this.modal.lastFocusableElement.focus()
                    event.preventDefault()
                }
            } else { // tab
                if (document.activeElement === this.modal.lastFocusableElement) {
                    this.modal.firstFocusableElement.focus()
                    event.preventDefault()
                }
            }
        }
    }

    Array.from(playerElements).forEach(playerElement => new MediaPlayer(playerElement));
});

function createPlayerCoordinator() {
    let players = {}
    let prevPlayerId = null;

    return {
        addPlayer(id) {
            players[id] = videojs.getPlayer(id)
        },

        updatePlayback(currentId) {
            if (!prevPlayerId) {
                prevPlayerId = currentId;
                return
            }
            if (prevPlayerId !== currentId) {
                players[prevPlayerId].pause();
                prevPlayerId = currentId
            }
        }
    }
}

const playerCoordinator = createPlayerCoordinator()

document.addEventListener('mediaplayer-loaded', e => {
    playerCoordinator.addPlayer(e.detail.id)
})
document.addEventListener('mediaplayer-play', e => {
    playerCoordinator.updatePlayback(e.detail.id)
})
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.8.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
;(function(factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports !== 'undefined') {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }

}(function($) {
    'use strict';
    var Slick = window.Slick || {};

    Slick = (function() {

        var instanceUid = 0;

        function Slick(element, settings) {

            var _ = this, dataSettings;

            _.defaults = {
                accessibility: true,
                adaptiveHeight: false,
                appendArrows: $(element),
                appendDots: $(element),
                arrows: true,
                asNavFor: null,
                prevArrow: '<button class="slick-prev" aria-label="Previous" type="button">Previous</button>',
                nextArrow: '<button class="slick-next" aria-label="Next" type="button">Next</button>',
                autoplay: false,
                autoplaySpeed: 3000,
                centerMode: false,
                centerPadding: '50px',
                cssEase: 'ease',
                customPaging: function(slider, i) {
                    return $('<button type="button" />').text(i + 1);
                },
                dots: false,
                dotsClass: 'slick-dots',
                draggable: true,
                easing: 'linear',
                edgeFriction: 0.35,
                fade: false,
                focusOnSelect: false,
                focusOnChange: false,
                infinite: true,
                initialSlide: 0,
                lazyLoad: 'ondemand',
                mobileFirst: false,
                pauseOnHover: true,
                pauseOnFocus: true,
                pauseOnDotsHover: false,
                respondTo: 'window',
                responsive: null,
                rows: 1,
                rtl: false,
                slide: '',
                slidesPerRow: 1,
                slidesToShow: 1,
                slidesToScroll: 1,
                speed: 500,
                swipe: true,
                swipeToSlide: false,
                touchMove: true,
                touchThreshold: 5,
                useCSS: true,
                useTransform: true,
                variableWidth: false,
                vertical: false,
                verticalSwiping: false,
                waitForAnimate: true,
                zIndex: 1000
            };

            _.initials = {
                animating: false,
                dragging: false,
                autoPlayTimer: null,
                currentDirection: 0,
                currentLeft: null,
                currentSlide: 0,
                direction: 1,
                $dots: null,
                listWidth: null,
                listHeight: null,
                loadIndex: 0,
                $nextArrow: null,
                $prevArrow: null,
                scrolling: false,
                slideCount: null,
                slideWidth: null,
                $slideTrack: null,
                $slides: null,
                sliding: false,
                slideOffset: 0,
                swipeLeft: null,
                swiping: false,
                $list: null,
                touchObject: {},
                transformsEnabled: false,
                unslicked: false
            };

            $.extend(_, _.initials);

            _.activeBreakpoint = null;
            _.animType = null;
            _.animProp = null;
            _.breakpoints = [];
            _.breakpointSettings = [];
            _.cssTransitions = false;
            _.focussed = false;
            _.interrupted = false;
            _.hidden = 'hidden';
            _.paused = true;
            _.positionProp = null;
            _.respondTo = null;
            _.rowCount = 1;
            _.shouldClick = true;
            _.$slider = $(element);
            _.$slidesCache = null;
            _.transformType = null;
            _.transitionType = null;
            _.visibilityChange = 'visibilitychange';
            _.windowWidth = 0;
            _.windowTimer = null;

            dataSettings = $(element).data('slick') || {};

            _.options = $.extend({}, _.defaults, settings, dataSettings);

            _.currentSlide = _.options.initialSlide;

            _.originalSettings = _.options;

            if (typeof document.mozHidden !== 'undefined') {
                _.hidden = 'mozHidden';
                _.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                _.hidden = 'webkitHidden';
                _.visibilityChange = 'webkitvisibilitychange';
            }

            _.autoPlay = $.proxy(_.autoPlay, _);
            _.autoPlayClear = $.proxy(_.autoPlayClear, _);
            _.autoPlayIterator = $.proxy(_.autoPlayIterator, _);
            _.changeSlide = $.proxy(_.changeSlide, _);
            _.clickHandler = $.proxy(_.clickHandler, _);
            _.selectHandler = $.proxy(_.selectHandler, _);
            _.setPosition = $.proxy(_.setPosition, _);
            _.swipeHandler = $.proxy(_.swipeHandler, _);
            _.dragHandler = $.proxy(_.dragHandler, _);
            _.keyHandler = $.proxy(_.keyHandler, _);

            _.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            _.htmlExpr = /^(?:\s*(<[\w\W]+>)[^>]*)$/;


            _.registerBreakpoints();
            _.init(true);

        }

        return Slick;

    }());

    Slick.prototype.activateADA = function() {
        var _ = this;

        _.$slideTrack.find('.slick-active').attr({
            'aria-hidden': 'false'
        }).find('a, input, button, select').attr({
            'tabindex': '0'
        });

    };

    Slick.prototype.addSlide = Slick.prototype.slickAdd = function(markup, index, addBefore) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            addBefore = index;
            index = null;
        } else if (index < 0 || (index >= _.slideCount)) {
            return false;
        }

        _.unload();

        if (typeof(index) === 'number') {
            if (index === 0 && _.$slides.length === 0) {
                $(markup).appendTo(_.$slideTrack);
            } else if (addBefore) {
                $(markup).insertBefore(_.$slides.eq(index));
            } else {
                $(markup).insertAfter(_.$slides.eq(index));
            }
        } else {
            if (addBefore === true) {
                $(markup).prependTo(_.$slideTrack);
            } else {
                $(markup).appendTo(_.$slideTrack);
            }
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slides.each(function(index, element) {
            $(element).attr('data-slick-index', index);
        });

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.animateHeight = function() {
        var _ = this;
        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.animate({
                height: targetHeight
            }, _.options.speed);
        }
    };

    Slick.prototype.animateSlide = function(targetLeft, callback) {

        var animProps = {},
            _ = this;

        _.animateHeight();

        if (_.options.rtl === true && _.options.vertical === false) {
            targetLeft = -targetLeft;
        }
        if (_.transformsEnabled === false) {
            if (_.options.vertical === false) {
                _.$slideTrack.animate({
                    left: targetLeft
                }, _.options.speed, _.options.easing, callback);
            } else {
                _.$slideTrack.animate({
                    top: targetLeft
                }, _.options.speed, _.options.easing, callback);
            }

        } else {

            if (_.cssTransitions === false) {
                if (_.options.rtl === true) {
                    _.currentLeft = -(_.currentLeft);
                }
                $({
                    animStart: _.currentLeft
                }).animate({
                    animStart: targetLeft
                }, {
                    duration: _.options.speed,
                    easing: _.options.easing,
                    step: function(now) {
                        now = Math.ceil(now);
                        if (_.options.vertical === false) {
                            animProps[_.animType] = 'translate(' +
                                now + 'px, 0px)';
                            _.$slideTrack.css(animProps);
                        } else {
                            animProps[_.animType] = 'translate(0px,' +
                                now + 'px)';
                            _.$slideTrack.css(animProps);
                        }
                    },
                    complete: function() {
                        if (callback) {
                            callback.call();
                        }
                    }
                });

            } else {

                _.applyTransition();
                targetLeft = Math.ceil(targetLeft);

                if (_.options.vertical === false) {
                    animProps[_.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                } else {
                    animProps[_.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                }
                _.$slideTrack.css(animProps);

                if (callback) {
                    setTimeout(function() {

                        _.disableTransition();

                        callback.call();
                    }, _.options.speed);
                }

            }

        }

    };

    Slick.prototype.getNavTarget = function() {

        var _ = this,
            asNavFor = _.options.asNavFor;

        if ( asNavFor && asNavFor !== null ) {
            asNavFor = $(asNavFor).not(_.$slider);
        }

        return asNavFor;

    };

    Slick.prototype.asNavFor = function(index) {

        var _ = this,
            asNavFor = _.getNavTarget();

        if ( asNavFor !== null && typeof asNavFor === 'object' ) {
            asNavFor.each(function() {
                var target = $(this).slick('getSlick');
                if(!target.unslicked) {
                    target.slideHandler(index, true);
                }
            });
        }

    };

    Slick.prototype.applyTransition = function(slide) {

        var _ = this,
            transition = {};

        if (_.options.fade === false) {
            transition[_.transitionType] = _.transformType + ' ' + _.options.speed + 'ms ' + _.options.cssEase;
        } else {
            transition[_.transitionType] = 'opacity ' + _.options.speed + 'ms ' + _.options.cssEase;
        }

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.autoPlay = function() {

        var _ = this;

        _.autoPlayClear();

        if ( _.slideCount > _.options.slidesToShow ) {
            _.autoPlayTimer = setInterval( _.autoPlayIterator, _.options.autoplaySpeed );
        }

    };

    Slick.prototype.autoPlayClear = function() {

        var _ = this;

        if (_.autoPlayTimer) {
            clearInterval(_.autoPlayTimer);
        }

    };

    Slick.prototype.autoPlayIterator = function() {

        var _ = this,
            slideTo = _.currentSlide + _.options.slidesToScroll;

        if ( !_.paused && !_.interrupted && !_.focussed ) {

            if ( _.options.infinite === false ) {

                if ( _.direction === 1 && ( _.currentSlide + 1 ) === ( _.slideCount - 1 )) {
                    _.direction = 0;
                }

                else if ( _.direction === 0 ) {

                    slideTo = _.currentSlide - _.options.slidesToScroll;

                    if ( _.currentSlide - 1 === 0 ) {
                        _.direction = 1;
                    }

                }

            }

            _.slideHandler( slideTo );

        }

    };

    Slick.prototype.buildArrows = function() {

        var _ = this;

        if (_.options.arrows === true ) {

            _.$prevArrow = $(_.options.prevArrow).addClass('slick-arrow');
            _.$nextArrow = $(_.options.nextArrow).addClass('slick-arrow');

            if( _.slideCount > _.options.slidesToShow ) {

                _.$prevArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');
                _.$nextArrow.removeClass('slick-hidden').removeAttr('aria-hidden tabindex');

                if (_.htmlExpr.test(_.options.prevArrow)) {
                    _.$prevArrow.prependTo(_.options.appendArrows);
                }

                if (_.htmlExpr.test(_.options.nextArrow)) {
                    _.$nextArrow.appendTo(_.options.appendArrows);
                }

                if (_.options.infinite !== true) {
                    _.$prevArrow
                        .addClass('slick-disabled')
                        .attr('aria-disabled', 'true');
                }

            } else {

                _.$prevArrow.add( _.$nextArrow )

                    .addClass('slick-hidden')
                    .attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });

            }

        }

    };

    Slick.prototype.buildDots = function() {

        var _ = this,
            i, dot;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$slider.addClass('slick-dotted');

            dot = $('<ul />').addClass(_.options.dotsClass);

            for (i = 0; i <= _.getDotCount(); i += 1) {
                dot.append($('<li />').append(_.options.customPaging.call(this, _, i)));
            }

            _.$dots = dot.appendTo(_.options.appendDots);

            _.$dots.find('li').first().addClass('slick-active');

        }

    };

    Slick.prototype.buildOut = function() {

        var _ = this;

        _.$slides =
            _.$slider
                .children( _.options.slide + ':not(.slick-cloned)')
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        _.$slides.each(function(index, element) {
            $(element)
                .attr('data-slick-index', index)
                .data('originalStyling', $(element).attr('style') || '');
        });

        _.$slider.addClass('slick-slider');

        _.$slideTrack = (_.slideCount === 0) ?
            $('<div class="slick-track"/>').appendTo(_.$slider) :
            _.$slides.wrapAll('<div class="slick-track"/>').parent();

        _.$list = _.$slideTrack.wrap(
            '<div class="slick-list"/>').parent();
        _.$slideTrack.css('opacity', 0);

        if (_.options.centerMode === true || _.options.swipeToSlide === true) {
            _.options.slidesToScroll = 1;
        }

        $('img[data-lazy]', _.$slider).not('[src]').addClass('slick-loading');

        _.setupInfinite();

        _.buildArrows();

        _.buildDots();

        _.updateDots();


        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        if (_.options.draggable === true) {
            _.$list.addClass('draggable');
        }

    };

    Slick.prototype.buildRows = function() {

        var _ = this, a, b, c, newSlides, numOfSlides, originalSlides,slidesPerSection;

        newSlides = document.createDocumentFragment();
        originalSlides = _.$slider.children();

        if(_.options.rows > 0) {

            slidesPerSection = _.options.slidesPerRow * _.options.rows;
            numOfSlides = Math.ceil(
                originalSlides.length / slidesPerSection
            );

            for(a = 0; a < numOfSlides; a++){
                var slide = document.createElement('div');
                for(b = 0; b < _.options.rows; b++) {
                    var row = document.createElement('div');
                    for(c = 0; c < _.options.slidesPerRow; c++) {
                        var target = (a * slidesPerSection + ((b * _.options.slidesPerRow) + c));
                        if (originalSlides.get(target)) {
                            row.appendChild(originalSlides.get(target));
                        }
                    }
                    slide.appendChild(row);
                }
                newSlides.appendChild(slide);
            }

            _.$slider.empty().append(newSlides);
            _.$slider.children().children().children()
                .css({
                    'width':(100 / _.options.slidesPerRow) + '%',
                    'display': 'inline-block'
                });

        }

    };

    Slick.prototype.checkResponsive = function(initial, forceUpdate) {

        var _ = this,
            breakpoint, targetBreakpoint, respondToWidth, triggerBreakpoint = false;
        var sliderWidth = _.$slider.width();
        var windowWidth = window.innerWidth || $(window).width();

        if (_.respondTo === 'window') {
            respondToWidth = windowWidth;
        } else if (_.respondTo === 'slider') {
            respondToWidth = sliderWidth;
        } else if (_.respondTo === 'min') {
            respondToWidth = Math.min(windowWidth, sliderWidth);
        }

        if ( _.options.responsive &&
            _.options.responsive.length &&
            _.options.responsive !== null) {

            targetBreakpoint = null;

            for (breakpoint in _.breakpoints) {
                if (_.breakpoints.hasOwnProperty(breakpoint)) {
                    if (_.originalSettings.mobileFirst === false) {
                        if (respondToWidth < _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    } else {
                        if (respondToWidth > _.breakpoints[breakpoint]) {
                            targetBreakpoint = _.breakpoints[breakpoint];
                        }
                    }
                }
            }

            if (targetBreakpoint !== null) {
                if (_.activeBreakpoint !== null) {
                    if (targetBreakpoint !== _.activeBreakpoint || forceUpdate) {
                        _.activeBreakpoint =
                            targetBreakpoint;
                        if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                            _.unslick(targetBreakpoint);
                        } else {
                            _.options = $.extend({}, _.originalSettings,
                                _.breakpointSettings[
                                    targetBreakpoint]);
                            if (initial === true) {
                                _.currentSlide = _.options.initialSlide;
                            }
                            _.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    _.activeBreakpoint = targetBreakpoint;
                    if (_.breakpointSettings[targetBreakpoint] === 'unslick') {
                        _.unslick(targetBreakpoint);
                    } else {
                        _.options = $.extend({}, _.originalSettings,
                            _.breakpointSettings[
                                targetBreakpoint]);
                        if (initial === true) {
                            _.currentSlide = _.options.initialSlide;
                        }
                        _.refresh(initial);
                    }
                    triggerBreakpoint = targetBreakpoint;
                }
            } else {
                if (_.activeBreakpoint !== null) {
                    _.activeBreakpoint = null;
                    _.options = _.originalSettings;
                    if (initial === true) {
                        _.currentSlide = _.options.initialSlide;
                    }
                    _.refresh(initial);
                    triggerBreakpoint = targetBreakpoint;
                }
            }

            // only trigger breakpoints during an actual break. not on initialize.
            if( !initial && triggerBreakpoint !== false ) {
                _.$slider.trigger('breakpoint', [_, triggerBreakpoint]);
            }
        }

    };

    Slick.prototype.changeSlide = function(event, dontAnimate) {

        var _ = this,
            $target = $(event.currentTarget),
            indexOffset, slideOffset, unevenOffset;

        // If target is a link, prevent default action.
        if($target.is('a')) {
            event.preventDefault();
        }

        // If target is not the <li> element (ie: a child), find the <li>.
        if(!$target.is('li')) {
            $target = $target.closest('li');
        }

        unevenOffset = (_.slideCount % _.options.slidesToScroll !== 0);
        indexOffset = unevenOffset ? 0 : (_.slideCount - _.currentSlide) % _.options.slidesToScroll;

        switch (event.data.message) {

            case 'previous':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : _.options.slidesToShow - indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide - slideOffset, false, dontAnimate);
                }
                break;

            case 'next':
                slideOffset = indexOffset === 0 ? _.options.slidesToScroll : indexOffset;
                if (_.slideCount > _.options.slidesToShow) {
                    _.slideHandler(_.currentSlide + slideOffset, false, dontAnimate);
                }
                break;

            case 'index':
                var index = event.data.index === 0 ? 0 :
                    event.data.index || $target.index() * _.options.slidesToScroll;

                _.slideHandler(_.checkNavigable(index), false, dontAnimate);
                $target.children().trigger('focus');
                break;

            default:
                return;
        }

    };

    Slick.prototype.checkNavigable = function(index) {

        var _ = this,
            navigables, prevNavigable;

        navigables = _.getNavigableIndexes();
        prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) {
            index = navigables[navigables.length - 1];
        } else {
            for (var n in navigables) {
                if (index < navigables[n]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[n];
            }
        }

        return index;
    };

    Slick.prototype.cleanUpEvents = function() {

        var _ = this;

        if (_.options.dots && _.$dots !== null) {

            $('li', _.$dots)
                .off('click.slick', _.changeSlide)
                .off('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .off('mouseleave.slick', $.proxy(_.interrupt, _, false));

            if (_.options.accessibility === true) {
                _.$dots.off('keydown.slick', _.keyHandler);
            }
        }

        _.$slider.off('focus.slick blur.slick');

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow && _.$prevArrow.off('click.slick', _.changeSlide);
            _.$nextArrow && _.$nextArrow.off('click.slick', _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow && _.$prevArrow.off('keydown.slick', _.keyHandler);
                _.$nextArrow && _.$nextArrow.off('keydown.slick', _.keyHandler);
            }
        }

        _.$list.off('touchstart.slick mousedown.slick', _.swipeHandler);
        _.$list.off('touchmove.slick mousemove.slick', _.swipeHandler);
        _.$list.off('touchend.slick mouseup.slick', _.swipeHandler);
        _.$list.off('touchcancel.slick mouseleave.slick', _.swipeHandler);

        _.$list.off('click.slick', _.clickHandler);

        $(document).off(_.visibilityChange, _.visibility);

        _.cleanUpSlideEvents();

        if (_.options.accessibility === true) {
            _.$list.off('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().off('click.slick', _.selectHandler);
        }

        $(window).off('orientationchange.slick.slick-' + _.instanceUid, _.orientationChange);

        $(window).off('resize.slick.slick-' + _.instanceUid, _.resize);

        $('[draggable!=true]', _.$slideTrack).off('dragstart', _.preventDefault);

        $(window).off('load.slick.slick-' + _.instanceUid, _.setPosition);

    };

    Slick.prototype.cleanUpSlideEvents = function() {

        var _ = this;

        _.$list.off('mouseenter.slick', $.proxy(_.interrupt, _, true));
        _.$list.off('mouseleave.slick', $.proxy(_.interrupt, _, false));

    };

    Slick.prototype.cleanUpRows = function() {

        var _ = this, originalSlides;

        if(_.options.rows > 0) {
            originalSlides = _.$slides.children().children();
            originalSlides.removeAttr('style');
            _.$slider.empty().append(originalSlides);
        }

    };

    Slick.prototype.clickHandler = function(event) {

        var _ = this;

        if (_.shouldClick === false) {
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
        }

    };

    Slick.prototype.destroy = function(refresh) {

        var _ = this;

        _.autoPlayClear();

        _.touchObject = {};

        _.cleanUpEvents();

        $('.slick-cloned', _.$slider).detach();

        if (_.$dots) {
            _.$dots.remove();
        }

        if ( _.$prevArrow && _.$prevArrow.length ) {

            _.$prevArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.prevArrow )) {
                _.$prevArrow.remove();
            }
        }

        if ( _.$nextArrow && _.$nextArrow.length ) {

            _.$nextArrow
                .removeClass('slick-disabled slick-arrow slick-hidden')
                .removeAttr('aria-hidden aria-disabled tabindex')
                .css('display','');

            if ( _.htmlExpr.test( _.options.nextArrow )) {
                _.$nextArrow.remove();
            }
        }


        if (_.$slides) {

            _.$slides
                .removeClass('slick-slide slick-active slick-center slick-visible slick-current')
                .removeAttr('aria-hidden')
                .removeAttr('data-slick-index')
                .each(function(){
                    $(this).attr('style', $(this).data('originalStyling'));
                });

            _.$slideTrack.children(this.options.slide).detach();

            _.$slideTrack.detach();

            _.$list.detach();

            _.$slider.append(_.$slides);
        }

        _.cleanUpRows();

        _.$slider.removeClass('slick-slider');
        _.$slider.removeClass('slick-initialized');
        _.$slider.removeClass('slick-dotted');

        _.unslicked = true;

        if(!refresh) {
            _.$slider.trigger('destroy', [_]);
        }

    };

    Slick.prototype.disableTransition = function(slide) {

        var _ = this,
            transition = {};

        transition[_.transitionType] = '';

        if (_.options.fade === false) {
            _.$slideTrack.css(transition);
        } else {
            _.$slides.eq(slide).css(transition);
        }

    };

    Slick.prototype.fadeSlide = function(slideIndex, callback) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).css({
                zIndex: _.options.zIndex
            });

            _.$slides.eq(slideIndex).animate({
                opacity: 1
            }, _.options.speed, _.options.easing, callback);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 1,
                zIndex: _.options.zIndex
            });

            if (callback) {
                setTimeout(function() {

                    _.disableTransition(slideIndex);

                    callback.call();
                }, _.options.speed);
            }

        }

    };

    Slick.prototype.fadeSlideOut = function(slideIndex) {

        var _ = this;

        if (_.cssTransitions === false) {

            _.$slides.eq(slideIndex).animate({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            }, _.options.speed, _.options.easing);

        } else {

            _.applyTransition(slideIndex);

            _.$slides.eq(slideIndex).css({
                opacity: 0,
                zIndex: _.options.zIndex - 2
            });

        }

    };

    Slick.prototype.filterSlides = Slick.prototype.slickFilter = function(filter) {

        var _ = this;

        if (filter !== null) {

            _.$slidesCache = _.$slides;

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.filter(filter).appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.focusHandler = function() {

        var _ = this;

        _.$slider
            .off('focus.slick blur.slick')
            .on('focus.slick blur.slick', '*', function(event) {

            event.stopImmediatePropagation();
            var $sf = $(this);

            setTimeout(function() {

                if( _.options.pauseOnFocus ) {
                    _.focussed = $sf.is(':focus');
                    _.autoPlay();
                }

            }, 0);

        });
    };

    Slick.prototype.getCurrent = Slick.prototype.slickCurrentSlide = function() {

        var _ = this;
        return _.currentSlide;

    };

    Slick.prototype.getDotCount = function() {

        var _ = this;

        var breakPoint = 0;
        var counter = 0;
        var pagerQty = 0;

        if (_.options.infinite === true) {
            if (_.slideCount <= _.options.slidesToShow) {
                 ++pagerQty;
            } else {
                while (breakPoint < _.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + _.options.slidesToScroll;
                    counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
                }
            }
        } else if (_.options.centerMode === true) {
            pagerQty = _.slideCount;
        } else if(!_.options.asNavFor) {
            pagerQty = 1 + Math.ceil((_.slideCount - _.options.slidesToShow) / _.options.slidesToScroll);
        }else {
            while (breakPoint < _.slideCount) {
                ++pagerQty;
                breakPoint = counter + _.options.slidesToScroll;
                counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
            }
        }

        return pagerQty - 1;

    };

    Slick.prototype.getLeft = function(slideIndex) {

        var _ = this,
            targetLeft,
            verticalHeight,
            verticalOffset = 0,
            targetSlide,
            coef;

        _.slideOffset = 0;
        verticalHeight = _.$slides.first().outerHeight(true);

        if (_.options.infinite === true) {
            if (_.slideCount > _.options.slidesToShow) {
                _.slideOffset = (_.slideWidth * _.options.slidesToShow) * -1;
                coef = -1

                if (_.options.vertical === true && _.options.centerMode === true) {
                    if (_.options.slidesToShow === 2) {
                        coef = -1.5;
                    } else if (_.options.slidesToShow === 1) {
                        coef = -2
                    }
                }
                verticalOffset = (verticalHeight * _.options.slidesToShow) * coef;
            }
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                if (slideIndex + _.options.slidesToScroll > _.slideCount && _.slideCount > _.options.slidesToShow) {
                    if (slideIndex > _.slideCount) {
                        _.slideOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * _.slideWidth) * -1;
                        verticalOffset = ((_.options.slidesToShow - (slideIndex - _.slideCount)) * verticalHeight) * -1;
                    } else {
                        _.slideOffset = ((_.slideCount % _.options.slidesToScroll) * _.slideWidth) * -1;
                        verticalOffset = ((_.slideCount % _.options.slidesToScroll) * verticalHeight) * -1;
                    }
                }
            }
        } else {
            if (slideIndex + _.options.slidesToShow > _.slideCount) {
                _.slideOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * _.slideWidth;
                verticalOffset = ((slideIndex + _.options.slidesToShow) - _.slideCount) * verticalHeight;
            }
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.slideOffset = 0;
            verticalOffset = 0;
        }

        if (_.options.centerMode === true && _.slideCount <= _.options.slidesToShow) {
            _.slideOffset = ((_.slideWidth * Math.floor(_.options.slidesToShow)) / 2) - ((_.slideWidth * _.slideCount) / 2);
        } else if (_.options.centerMode === true && _.options.infinite === true) {
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2) - _.slideWidth;
        } else if (_.options.centerMode === true) {
            _.slideOffset = 0;
            _.slideOffset += _.slideWidth * Math.floor(_.options.slidesToShow / 2);
        }

        if (_.options.vertical === false) {
            targetLeft = ((slideIndex * _.slideWidth) * -1) + _.slideOffset;
        } else {
            targetLeft = ((slideIndex * verticalHeight) * -1) + verticalOffset;
        }

        if (_.options.variableWidth === true) {

            if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
            } else {
                targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow);
            }

            if (_.options.rtl === true) {
                if (targetSlide[0]) {
                    targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                } else {
                    targetLeft =  0;
                }
            } else {
                targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
            }

            if (_.options.centerMode === true) {
                if (_.slideCount <= _.options.slidesToShow || _.options.infinite === false) {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex);
                } else {
                    targetSlide = _.$slideTrack.children('.slick-slide').eq(slideIndex + _.options.slidesToShow + 1);
                }

                if (_.options.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (_.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft =  0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                targetLeft += (_.$list.width() - targetSlide.outerWidth()) / 2;
            }
        }

        return targetLeft;

    };

    Slick.prototype.getOption = Slick.prototype.slickGetOption = function(option) {

        var _ = this;

        return _.options[option];

    };

    Slick.prototype.getNavigableIndexes = function() {

        var _ = this,
            breakPoint = 0,
            counter = 0,
            indexes = [],
            max;

        if (_.options.infinite === false) {
            max = _.slideCount;
        } else {
            breakPoint = _.options.slidesToScroll * -1;
            counter = _.options.slidesToScroll * -1;
            max = _.slideCount * 2;
        }

        while (breakPoint < max) {
            indexes.push(breakPoint);
            breakPoint = counter + _.options.slidesToScroll;
            counter += _.options.slidesToScroll <= _.options.slidesToShow ? _.options.slidesToScroll : _.options.slidesToShow;
        }

        return indexes;

    };

    Slick.prototype.getSlick = function() {

        return this;

    };

    Slick.prototype.getSlideCount = function() {

        var _ = this,
            slidesTraversed, swipedSlide, centerOffset;

        centerOffset = _.options.centerMode === true ? _.slideWidth * Math.floor(_.options.slidesToShow / 2) : 0;

        if (_.options.swipeToSlide === true) {
            _.$slideTrack.find('.slick-slide').each(function(index, slide) {
                if (slide.offsetLeft - centerOffset + ($(slide).outerWidth() / 2) > (_.swipeLeft * -1)) {
                    swipedSlide = slide;
                    return false;
                }
            });

            slidesTraversed = Math.abs($(swipedSlide).attr('data-slick-index') - _.currentSlide) || 1;

            return slidesTraversed;

        } else {
            return _.options.slidesToScroll;
        }

    };

    Slick.prototype.goTo = Slick.prototype.slickGoTo = function(slide, dontAnimate) {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'index',
                index: parseInt(slide)
            }
        }, dontAnimate);

    };

    Slick.prototype.init = function(creation) {

        var _ = this;

        if (!$(_.$slider).hasClass('slick-initialized')) {

            $(_.$slider).addClass('slick-initialized');

            _.buildRows();
            _.buildOut();
            _.setProps();
            _.startLoad();
            _.loadSlider();
            _.initializeEvents();
            _.updateArrows();
            _.updateDots();
            _.checkResponsive(true);
            _.focusHandler();

        }

        if (creation) {
            _.$slider.trigger('init', [_]);
        }

        if (_.options.accessibility === true) {
            _.initADA();
        }

        if ( _.options.autoplay ) {

            _.paused = false;
            _.autoPlay();

        }

    };

    Slick.prototype.initADA = function() {
        var _ = this,
                numDotGroups = Math.ceil(_.slideCount / _.options.slidesToShow),
                tabControlIndexes = _.getNavigableIndexes().filter(function(val) {
                    return (val >= 0) && (val < _.slideCount);
                });

        _.$slides.add(_.$slideTrack.find('.slick-cloned')).attr({
            'aria-hidden': 'true',
            'tabindex': '-1'
        }).find('a, input, button, select').attr({
            'tabindex': '-1'
        });

        if (_.$dots !== null) {
            _.$slides.not(_.$slideTrack.find('.slick-cloned')).each(function(i) {
                var slideControlIndex = tabControlIndexes.indexOf(i);

                $(this).attr({
                    'role': 'tabpanel',
                    'id': 'slick-slide' + _.instanceUid + i,
                    'tabindex': -1
                });

                if (slideControlIndex !== -1) {
                   var ariaButtonControl = 'slick-slide-control' + _.instanceUid + slideControlIndex
                   if ($('#' + ariaButtonControl).length) {
                     $(this).attr({
                         'aria-describedby': ariaButtonControl
                     });
                   }
                }
            });

            _.$dots.attr('role', 'tablist').find('li').each(function(i) {
                var mappedSlideIndex = tabControlIndexes[i];

                $(this).attr({
                    'role': 'presentation'
                });

                $(this).find('button').first().attr({
                    'role': 'tab',
                    'id': 'slick-slide-control' + _.instanceUid + i,
                    'aria-controls': 'slick-slide' + _.instanceUid + mappedSlideIndex,
                    'aria-label': (i + 1) + ' of ' + numDotGroups,
                    'aria-selected': null,
                    'tabindex': '-1'
                });

            }).eq(_.currentSlide).find('button').attr({
                'aria-selected': 'true',
                'tabindex': '0'
            }).end();
        }

        for (var i=_.currentSlide, max=i+_.options.slidesToShow; i < max; i++) {
          if (_.options.focusOnChange) {
            _.$slides.eq(i).attr({'tabindex': '0'});
          } else {
            _.$slides.eq(i).removeAttr('tabindex');
          }
        }

        _.activateADA();

    };

    Slick.prototype.initArrowEvents = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {
            _.$prevArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'previous'
               }, _.changeSlide);
            _.$nextArrow
               .off('click.slick')
               .on('click.slick', {
                    message: 'next'
               }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$prevArrow.on('keydown.slick', _.keyHandler);
                _.$nextArrow.on('keydown.slick', _.keyHandler);
            }
        }

    };

    Slick.prototype.initDotEvents = function() {

        var _ = this;

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {
            $('li', _.$dots).on('click.slick', {
                message: 'index'
            }, _.changeSlide);

            if (_.options.accessibility === true) {
                _.$dots.on('keydown.slick', _.keyHandler);
            }
        }

        if (_.options.dots === true && _.options.pauseOnDotsHover === true && _.slideCount > _.options.slidesToShow) {

            $('li', _.$dots)
                .on('mouseenter.slick', $.proxy(_.interrupt, _, true))
                .on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initSlideEvents = function() {

        var _ = this;

        if ( _.options.pauseOnHover ) {

            _.$list.on('mouseenter.slick', $.proxy(_.interrupt, _, true));
            _.$list.on('mouseleave.slick', $.proxy(_.interrupt, _, false));

        }

    };

    Slick.prototype.initializeEvents = function() {

        var _ = this;

        _.initArrowEvents();

        _.initDotEvents();
        _.initSlideEvents();

        _.$list.on('touchstart.slick mousedown.slick', {
            action: 'start'
        }, _.swipeHandler);
        _.$list.on('touchmove.slick mousemove.slick', {
            action: 'move'
        }, _.swipeHandler);
        _.$list.on('touchend.slick mouseup.slick', {
            action: 'end'
        }, _.swipeHandler);
        _.$list.on('touchcancel.slick mouseleave.slick', {
            action: 'end'
        }, _.swipeHandler);

        _.$list.on('click.slick', _.clickHandler);

        $(document).on(_.visibilityChange, $.proxy(_.visibility, _));

        if (_.options.accessibility === true) {
            _.$list.on('keydown.slick', _.keyHandler);
        }

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        $(window).on('orientationchange.slick.slick-' + _.instanceUid, $.proxy(_.orientationChange, _));

        $(window).on('resize.slick.slick-' + _.instanceUid, $.proxy(_.resize, _));

        $('[draggable!=true]', _.$slideTrack).on('dragstart', _.preventDefault);

        $(window).on('load.slick.slick-' + _.instanceUid, _.setPosition);
        $(_.setPosition);

    };

    Slick.prototype.initUI = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.show();
            _.$nextArrow.show();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.show();

        }

    };

    Slick.prototype.keyHandler = function(event) {

        var _ = this;
         //Dont slide if the cursor is inside the form fields and arrow keys are pressed
        if(!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
            if (event.keyCode === 37 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'next' :  'previous'
                    }
                });
            } else if (event.keyCode === 39 && _.options.accessibility === true) {
                _.changeSlide({
                    data: {
                        message: _.options.rtl === true ? 'previous' : 'next'
                    }
                });
            }
        }

    };

    Slick.prototype.lazyLoad = function() {

        var _ = this,
            loadRange, cloneRange, rangeStart, rangeEnd;

        function loadImages(imagesScope) {

            $('img[data-lazy]', imagesScope).each(function() {

                var image = $(this),
                    imageSource = $(this).attr('data-lazy'),
                    imageSrcSet = $(this).attr('data-srcset'),
                    imageSizes  = $(this).attr('data-sizes') || _.$slider.attr('data-sizes'),
                    imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    image
                        .animate({ opacity: 0 }, 100, function() {

                            if (imageSrcSet) {
                                image
                                    .attr('srcset', imageSrcSet );

                                if (imageSizes) {
                                    image
                                        .attr('sizes', imageSizes );
                                }
                            }

                            image
                                .attr('src', imageSource)
                                .animate({ opacity: 1 }, 200, function() {
                                    image
                                        .removeAttr('data-lazy data-srcset data-sizes')
                                        .removeClass('slick-loading');
                                });
                            _.$slider.trigger('lazyLoaded', [_, image, imageSource]);
                        });

                };

                imageToLoad.onerror = function() {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                };

                imageToLoad.src = imageSource;

            });

        }

        if (_.options.centerMode === true) {
            if (_.options.infinite === true) {
                rangeStart = _.currentSlide + (_.options.slidesToShow / 2 + 1);
                rangeEnd = rangeStart + _.options.slidesToShow + 2;
            } else {
                rangeStart = Math.max(0, _.currentSlide - (_.options.slidesToShow / 2 + 1));
                rangeEnd = 2 + (_.options.slidesToShow / 2 + 1) + _.currentSlide;
            }
        } else {
            rangeStart = _.options.infinite ? _.options.slidesToShow + _.currentSlide : _.currentSlide;
            rangeEnd = Math.ceil(rangeStart + _.options.slidesToShow);
            if (_.options.fade === true) {
                if (rangeStart > 0) rangeStart--;
                if (rangeEnd <= _.slideCount) rangeEnd++;
            }
        }

        loadRange = _.$slider.find('.slick-slide').slice(rangeStart, rangeEnd);

        if (_.options.lazyLoad === 'anticipated') {
            var prevSlide = rangeStart - 1,
                nextSlide = rangeEnd,
                $slides = _.$slider.find('.slick-slide');

            for (var i = 0; i < _.options.slidesToScroll; i++) {
                if (prevSlide < 0) prevSlide = _.slideCount - 1;
                loadRange = loadRange.add($slides.eq(prevSlide));
                loadRange = loadRange.add($slides.eq(nextSlide));
                prevSlide--;
                nextSlide++;
            }
        }

        loadImages(loadRange);

        if (_.slideCount <= _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-slide');
            loadImages(cloneRange);
        } else
        if (_.currentSlide >= _.slideCount - _.options.slidesToShow) {
            cloneRange = _.$slider.find('.slick-cloned').slice(0, _.options.slidesToShow);
            loadImages(cloneRange);
        } else if (_.currentSlide === 0) {
            cloneRange = _.$slider.find('.slick-cloned').slice(_.options.slidesToShow * -1);
            loadImages(cloneRange);
        }

    };

    Slick.prototype.loadSlider = function() {

        var _ = this;

        _.setPosition();

        _.$slideTrack.css({
            opacity: 1
        });

        _.$slider.removeClass('slick-loading');

        _.initUI();

        if (_.options.lazyLoad === 'progressive') {
            _.progressiveLazyLoad();
        }

    };

    Slick.prototype.next = Slick.prototype.slickNext = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'next'
            }
        });

    };

    Slick.prototype.orientationChange = function() {

        var _ = this;

        _.checkResponsive();
        _.setPosition();

    };

    Slick.prototype.pause = Slick.prototype.slickPause = function() {

        var _ = this;

        _.autoPlayClear();
        _.paused = true;

    };

    Slick.prototype.play = Slick.prototype.slickPlay = function() {

        var _ = this;

        _.autoPlay();
        _.options.autoplay = true;
        _.paused = false;
        _.focussed = false;
        _.interrupted = false;

    };

    Slick.prototype.postSlide = function(index) {

        var _ = this;

        if( !_.unslicked ) {

            _.$slider.trigger('afterChange', [_, index]);

            _.animating = false;

            if (_.slideCount > _.options.slidesToShow) {
                _.setPosition();
            }

            _.swipeLeft = null;

            if ( _.options.autoplay ) {
                _.autoPlay();
            }

            if (_.options.accessibility === true) {
                _.initADA();

                if (_.options.focusOnChange) {
                    var $currentSlide = $(_.$slides.get(_.currentSlide));
                    $currentSlide.attr('tabindex', 0).focus();
                }
            }

        }

    };

    Slick.prototype.prev = Slick.prototype.slickPrev = function() {

        var _ = this;

        _.changeSlide({
            data: {
                message: 'previous'
            }
        });

    };

    Slick.prototype.preventDefault = function(event) {

        event.preventDefault();

    };

    Slick.prototype.progressiveLazyLoad = function( tryCount ) {

        tryCount = tryCount || 1;

        var _ = this,
            $imgsToLoad = $( 'img[data-lazy]', _.$slider ),
            image,
            imageSource,
            imageSrcSet,
            imageSizes,
            imageToLoad;

        if ( $imgsToLoad.length ) {

            image = $imgsToLoad.first();
            imageSource = image.attr('data-lazy');
            imageSrcSet = image.attr('data-srcset');
            imageSizes  = image.attr('data-sizes') || _.$slider.attr('data-sizes');
            imageToLoad = document.createElement('img');

            imageToLoad.onload = function() {

                if (imageSrcSet) {
                    image
                        .attr('srcset', imageSrcSet );

                    if (imageSizes) {
                        image
                            .attr('sizes', imageSizes );
                    }
                }

                image
                    .attr( 'src', imageSource )
                    .removeAttr('data-lazy data-srcset data-sizes')
                    .removeClass('slick-loading');

                if ( _.options.adaptiveHeight === true ) {
                    _.setPosition();
                }

                _.$slider.trigger('lazyLoaded', [ _, image, imageSource ]);
                _.progressiveLazyLoad();

            };

            imageToLoad.onerror = function() {

                if ( tryCount < 3 ) {

                    /**
                     * try to load the image 3 times,
                     * leave a slight delay so we don't get
                     * servers blocking the request.
                     */
                    setTimeout( function() {
                        _.progressiveLazyLoad( tryCount + 1 );
                    }, 500 );

                } else {

                    image
                        .removeAttr( 'data-lazy' )
                        .removeClass( 'slick-loading' )
                        .addClass( 'slick-lazyload-error' );

                    _.$slider.trigger('lazyLoadError', [ _, image, imageSource ]);

                    _.progressiveLazyLoad();

                }

            };

            imageToLoad.src = imageSource;

        } else {

            _.$slider.trigger('allImagesLoaded', [ _ ]);

        }

    };

    Slick.prototype.refresh = function( initializing ) {

        var _ = this, currentSlide, lastVisibleIndex;

        lastVisibleIndex = _.slideCount - _.options.slidesToShow;

        // in non-infinite sliders, we don't want to go past the
        // last visible index.
        if( !_.options.infinite && ( _.currentSlide > lastVisibleIndex )) {
            _.currentSlide = lastVisibleIndex;
        }

        // if less slides than to show, go to start.
        if ( _.slideCount <= _.options.slidesToShow ) {
            _.currentSlide = 0;

        }

        currentSlide = _.currentSlide;

        _.destroy(true);

        $.extend(_, _.initials, { currentSlide: currentSlide });

        _.init();

        if( !initializing ) {

            _.changeSlide({
                data: {
                    message: 'index',
                    index: currentSlide
                }
            }, false);

        }

    };

    Slick.prototype.registerBreakpoints = function() {

        var _ = this, breakpoint, currentBreakpoint, l,
            responsiveSettings = _.options.responsive || null;

        if ( $.type(responsiveSettings) === 'array' && responsiveSettings.length ) {

            _.respondTo = _.options.respondTo || 'window';

            for ( breakpoint in responsiveSettings ) {

                l = _.breakpoints.length-1;

                if (responsiveSettings.hasOwnProperty(breakpoint)) {
                    currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                    // loop through the breakpoints and cut out any existing
                    // ones with the same breakpoint number, we don't want dupes.
                    while( l >= 0 ) {
                        if( _.breakpoints[l] && _.breakpoints[l] === currentBreakpoint ) {
                            _.breakpoints.splice(l,1);
                        }
                        l--;
                    }

                    _.breakpoints.push(currentBreakpoint);
                    _.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;

                }

            }

            _.breakpoints.sort(function(a, b) {
                return ( _.options.mobileFirst ) ? a-b : b-a;
            });

        }

    };

    Slick.prototype.reinit = function() {

        var _ = this;

        _.$slides =
            _.$slideTrack
                .children(_.options.slide)
                .addClass('slick-slide');

        _.slideCount = _.$slides.length;

        if (_.currentSlide >= _.slideCount && _.currentSlide !== 0) {
            _.currentSlide = _.currentSlide - _.options.slidesToScroll;
        }

        if (_.slideCount <= _.options.slidesToShow) {
            _.currentSlide = 0;
        }

        _.registerBreakpoints();

        _.setProps();
        _.setupInfinite();
        _.buildArrows();
        _.updateArrows();
        _.initArrowEvents();
        _.buildDots();
        _.updateDots();
        _.initDotEvents();
        _.cleanUpSlideEvents();
        _.initSlideEvents();

        _.checkResponsive(false, true);

        if (_.options.focusOnSelect === true) {
            $(_.$slideTrack).children().on('click.slick', _.selectHandler);
        }

        _.setSlideClasses(typeof _.currentSlide === 'number' ? _.currentSlide : 0);

        _.setPosition();
        _.focusHandler();

        _.paused = !_.options.autoplay;
        _.autoPlay();

        _.$slider.trigger('reInit', [_]);

    };

    Slick.prototype.resize = function() {

        var _ = this;

        if ($(window).width() !== _.windowWidth) {
            clearTimeout(_.windowDelay);
            _.windowDelay = window.setTimeout(function() {
                _.windowWidth = $(window).width();
                _.checkResponsive();
                if( !_.unslicked ) { _.setPosition(); }
            }, 50);
        }
    };

    Slick.prototype.removeSlide = Slick.prototype.slickRemove = function(index, removeBefore, removeAll) {

        var _ = this;

        if (typeof(index) === 'boolean') {
            removeBefore = index;
            index = removeBefore === true ? 0 : _.slideCount - 1;
        } else {
            index = removeBefore === true ? --index : index;
        }

        if (_.slideCount < 1 || index < 0 || index > _.slideCount - 1) {
            return false;
        }

        _.unload();

        if (removeAll === true) {
            _.$slideTrack.children().remove();
        } else {
            _.$slideTrack.children(this.options.slide).eq(index).remove();
        }

        _.$slides = _.$slideTrack.children(this.options.slide);

        _.$slideTrack.children(this.options.slide).detach();

        _.$slideTrack.append(_.$slides);

        _.$slidesCache = _.$slides;

        _.reinit();

    };

    Slick.prototype.setCSS = function(position) {

        var _ = this,
            positionProps = {},
            x, y;

        if (_.options.rtl === true) {
            position = -position;
        }
        x = _.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
        y = _.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

        positionProps[_.positionProp] = position;

        if (_.transformsEnabled === false) {
            _.$slideTrack.css(positionProps);
        } else {
            positionProps = {};
            if (_.cssTransitions === false) {
                positionProps[_.animType] = 'translate(' + x + ', ' + y + ')';
                _.$slideTrack.css(positionProps);
            } else {
                positionProps[_.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                _.$slideTrack.css(positionProps);
            }
        }

    };

    Slick.prototype.setDimensions = function() {

        var _ = this;

        if (_.options.vertical === false) {
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: ('0px ' + _.options.centerPadding)
                });
            }
        } else {
            _.$list.height(_.$slides.first().outerHeight(true) * _.options.slidesToShow);
            if (_.options.centerMode === true) {
                _.$list.css({
                    padding: (_.options.centerPadding + ' 0px')
                });
            }
        }

        _.listWidth = _.$list.width();
        _.listHeight = _.$list.height();


        if (_.options.vertical === false && _.options.variableWidth === false) {
            _.slideWidth = Math.ceil(_.listWidth / _.options.slidesToShow);
            _.$slideTrack.width(Math.ceil((_.slideWidth * _.$slideTrack.children('.slick-slide').length)));

        } else if (_.options.variableWidth === true) {
            _.$slideTrack.width(5000 * _.slideCount);
        } else {
            _.slideWidth = Math.ceil(_.listWidth);
            _.$slideTrack.height(Math.ceil((_.$slides.first().outerHeight(true) * _.$slideTrack.children('.slick-slide').length)));
        }

        var offset = _.$slides.first().outerWidth(true) - _.$slides.first().width();
        if (_.options.variableWidth === false) _.$slideTrack.children('.slick-slide').width(_.slideWidth - offset);

    };

    Slick.prototype.setFade = function() {

        var _ = this,
            targetLeft;

        _.$slides.each(function(index, element) {
            targetLeft = (_.slideWidth * index) * -1;
            if (_.options.rtl === true) {
                $(element).css({
                    position: 'relative',
                    right: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            } else {
                $(element).css({
                    position: 'relative',
                    left: targetLeft,
                    top: 0,
                    zIndex: _.options.zIndex - 2,
                    opacity: 0
                });
            }
        });

        _.$slides.eq(_.currentSlide).css({
            zIndex: _.options.zIndex - 1,
            opacity: 1
        });

    };

    Slick.prototype.setHeight = function() {

        var _ = this;

        if (_.options.slidesToShow === 1 && _.options.adaptiveHeight === true && _.options.vertical === false) {
            var targetHeight = _.$slides.eq(_.currentSlide).outerHeight(true);
            _.$list.css('height', targetHeight);
        }

    };

    Slick.prototype.setOption =
    Slick.prototype.slickSetOption = function() {

        /**
         * accepts arguments in format of:
         *
         *  - for changing a single option's value:
         *     .slick("setOption", option, value, refresh )
         *
         *  - for changing a set of responsive options:
         *     .slick("setOption", 'responsive', [{}, ...], refresh )
         *
         *  - for updating multiple values at once (not responsive)
         *     .slick("setOption", { 'option': value, ... }, refresh )
         */

        var _ = this, l, item, option, value, refresh = false, type;

        if( $.type( arguments[0] ) === 'object' ) {

            option =  arguments[0];
            refresh = arguments[1];
            type = 'multiple';

        } else if ( $.type( arguments[0] ) === 'string' ) {

            option =  arguments[0];
            value = arguments[1];
            refresh = arguments[2];

            if ( arguments[0] === 'responsive' && $.type( arguments[1] ) === 'array' ) {

                type = 'responsive';

            } else if ( typeof arguments[1] !== 'undefined' ) {

                type = 'single';

            }

        }

        if ( type === 'single' ) {

            _.options[option] = value;


        } else if ( type === 'multiple' ) {

            $.each( option , function( opt, val ) {

                _.options[opt] = val;

            });


        } else if ( type === 'responsive' ) {

            for ( item in value ) {

                if( $.type( _.options.responsive ) !== 'array' ) {

                    _.options.responsive = [ value[item] ];

                } else {

                    l = _.options.responsive.length-1;

                    // loop through the responsive object and splice out duplicates.
                    while( l >= 0 ) {

                        if( _.options.responsive[l].breakpoint === value[item].breakpoint ) {

                            _.options.responsive.splice(l,1);

                        }

                        l--;

                    }

                    _.options.responsive.push( value[item] );

                }

            }

        }

        if ( refresh ) {

            _.unload();
            _.reinit();

        }

    };

    Slick.prototype.setPosition = function() {

        var _ = this;

        _.setDimensions();

        _.setHeight();

        if (_.options.fade === false) {
            _.setCSS(_.getLeft(_.currentSlide));
        } else {
            _.setFade();
        }

        _.$slider.trigger('setPosition', [_]);

    };

    Slick.prototype.setProps = function() {

        var _ = this,
            bodyStyle = document.body.style;

        _.positionProp = _.options.vertical === true ? 'top' : 'left';

        if (_.positionProp === 'top') {
            _.$slider.addClass('slick-vertical');
        } else {
            _.$slider.removeClass('slick-vertical');
        }

        if (bodyStyle.WebkitTransition !== undefined ||
            bodyStyle.MozTransition !== undefined ||
            bodyStyle.msTransition !== undefined) {
            if (_.options.useCSS === true) {
                _.cssTransitions = true;
            }
        }

        if ( _.options.fade ) {
            if ( typeof _.options.zIndex === 'number' ) {
                if( _.options.zIndex < 3 ) {
                    _.options.zIndex = 3;
                }
            } else {
                _.options.zIndex = _.defaults.zIndex;
            }
        }

        if (bodyStyle.OTransform !== undefined) {
            _.animType = 'OTransform';
            _.transformType = '-o-transform';
            _.transitionType = 'OTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.MozTransform !== undefined) {
            _.animType = 'MozTransform';
            _.transformType = '-moz-transform';
            _.transitionType = 'MozTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.webkitTransform !== undefined) {
            _.animType = 'webkitTransform';
            _.transformType = '-webkit-transform';
            _.transitionType = 'webkitTransition';
            if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) _.animType = false;
        }
        if (bodyStyle.msTransform !== undefined) {
            _.animType = 'msTransform';
            _.transformType = '-ms-transform';
            _.transitionType = 'msTransition';
            if (bodyStyle.msTransform === undefined) _.animType = false;
        }
        if (bodyStyle.transform !== undefined && _.animType !== false) {
            _.animType = 'transform';
            _.transformType = 'transform';
            _.transitionType = 'transition';
        }
        _.transformsEnabled = _.options.useTransform && (_.animType !== null && _.animType !== false);
    };


    Slick.prototype.setSlideClasses = function(index) {

        var _ = this,
            centerOffset, allSlides, indexOffset, remainder;

        allSlides = _.$slider
            .find('.slick-slide')
            .removeClass('slick-active slick-center slick-current')
            .attr('aria-hidden', 'true');

        _.$slides
            .eq(index)
            .addClass('slick-current');

        if (_.options.centerMode === true) {

            var evenCoef = _.options.slidesToShow % 2 === 0 ? 1 : 0;

            centerOffset = Math.floor(_.options.slidesToShow / 2);

            if (_.options.infinite === true) {

                if (index >= centerOffset && index <= (_.slideCount - 1) - centerOffset) {
                    _.$slides
                        .slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    indexOffset = _.options.slidesToShow + index;
                    allSlides
                        .slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

                if (index === 0) {

                    allSlides
                        .eq(allSlides.length - 1 - _.options.slidesToShow)
                        .addClass('slick-center');

                } else if (index === _.slideCount - 1) {

                    allSlides
                        .eq(_.options.slidesToShow)
                        .addClass('slick-center');

                }

            }

            _.$slides
                .eq(index)
                .addClass('slick-center');

        } else {

            if (index >= 0 && index <= (_.slideCount - _.options.slidesToShow)) {

                _.$slides
                    .slice(index, index + _.options.slidesToShow)
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else if (allSlides.length <= _.options.slidesToShow) {

                allSlides
                    .addClass('slick-active')
                    .attr('aria-hidden', 'false');

            } else {

                remainder = _.slideCount % _.options.slidesToShow;
                indexOffset = _.options.infinite === true ? _.options.slidesToShow + index : index;

                if (_.options.slidesToShow == _.options.slidesToScroll && (_.slideCount - index) < _.options.slidesToShow) {

                    allSlides
                        .slice(indexOffset - (_.options.slidesToShow - remainder), indexOffset + remainder)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                } else {

                    allSlides
                        .slice(indexOffset, indexOffset + _.options.slidesToShow)
                        .addClass('slick-active')
                        .attr('aria-hidden', 'false');

                }

            }

        }

        if (_.options.lazyLoad === 'ondemand' || _.options.lazyLoad === 'anticipated') {
            _.lazyLoad();
        }
    };

    Slick.prototype.setupInfinite = function() {

        var _ = this,
            i, slideIndex, infiniteCount;

        if (_.options.fade === true) {
            _.options.centerMode = false;
        }

        if (_.options.infinite === true && _.options.fade === false) {

            slideIndex = null;

            if (_.slideCount > _.options.slidesToShow) {

                if (_.options.centerMode === true) {
                    infiniteCount = _.options.slidesToShow + 1;
                } else {
                    infiniteCount = _.options.slidesToShow;
                }

                for (i = _.slideCount; i > (_.slideCount -
                        infiniteCount); i -= 1) {
                    slideIndex = i - 1;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex - _.slideCount)
                        .prependTo(_.$slideTrack).addClass('slick-cloned');
                }
                for (i = 0; i < infiniteCount  + _.slideCount; i += 1) {
                    slideIndex = i;
                    $(_.$slides[slideIndex]).clone(true).attr('id', '')
                        .attr('data-slick-index', slideIndex + _.slideCount)
                        .appendTo(_.$slideTrack).addClass('slick-cloned');
                }
                _.$slideTrack.find('.slick-cloned').find('[id]').each(function() {
                    $(this).attr('id', '');
                });

            }

        }

    };

    Slick.prototype.interrupt = function( toggle ) {

        var _ = this;

        if( !toggle ) {
            _.autoPlay();
        }
        _.interrupted = toggle;

    };

    Slick.prototype.selectHandler = function(event) {

        var _ = this;

        var targetElement =
            $(event.target).is('.slick-slide') ?
                $(event.target) :
                $(event.target).parents('.slick-slide');

        var index = parseInt(targetElement.attr('data-slick-index'));

        if (!index) index = 0;

        if (_.slideCount <= _.options.slidesToShow) {

            _.slideHandler(index, false, true);
            return;

        }

        _.slideHandler(index);

    };

    Slick.prototype.slideHandler = function(index, sync, dontAnimate) {

        var targetSlide, animSlide, oldSlide, slideLeft, targetLeft = null,
            _ = this, navTarget;

        sync = sync || false;

        if (_.animating === true && _.options.waitForAnimate === true) {
            return;
        }

        if (_.options.fade === true && _.currentSlide === index) {
            return;
        }

        if (sync === false) {
            _.asNavFor(index);
        }

        targetSlide = index;
        targetLeft = _.getLeft(targetSlide);
        slideLeft = _.getLeft(_.currentSlide);

        _.currentLeft = _.swipeLeft === null ? slideLeft : _.swipeLeft;

        if (_.options.infinite === false && _.options.centerMode === false && (index < 0 || index > _.getDotCount() * _.options.slidesToScroll)) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        } else if (_.options.infinite === false && _.options.centerMode === true && (index < 0 || index > (_.slideCount - _.options.slidesToScroll))) {
            if (_.options.fade === false) {
                targetSlide = _.currentSlide;
                if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
                    _.animateSlide(slideLeft, function() {
                        _.postSlide(targetSlide);
                    });
                } else {
                    _.postSlide(targetSlide);
                }
            }
            return;
        }

        if ( _.options.autoplay ) {
            clearInterval(_.autoPlayTimer);
        }

        if (targetSlide < 0) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = _.slideCount - (_.slideCount % _.options.slidesToScroll);
            } else {
                animSlide = _.slideCount + targetSlide;
            }
        } else if (targetSlide >= _.slideCount) {
            if (_.slideCount % _.options.slidesToScroll !== 0) {
                animSlide = 0;
            } else {
                animSlide = targetSlide - _.slideCount;
            }
        } else {
            animSlide = targetSlide;
        }

        _.animating = true;

        _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);

        oldSlide = _.currentSlide;
        _.currentSlide = animSlide;

        _.setSlideClasses(_.currentSlide);

        if ( _.options.asNavFor ) {

            navTarget = _.getNavTarget();
            navTarget = navTarget.slick('getSlick');

            if ( navTarget.slideCount <= navTarget.options.slidesToShow ) {
                navTarget.setSlideClasses(_.currentSlide);
            }

        }

        _.updateDots();
        _.updateArrows();

        if (_.options.fade === true) {
            if (dontAnimate !== true) {

                _.fadeSlideOut(oldSlide);

                _.fadeSlide(animSlide, function() {
                    _.postSlide(animSlide);
                });

            } else {
                _.postSlide(animSlide);
            }
            _.animateHeight();
            return;
        }

        if (dontAnimate !== true && _.slideCount > _.options.slidesToShow) {
            _.animateSlide(targetLeft, function() {
                _.postSlide(animSlide);
            });
        } else {
            _.postSlide(animSlide);
        }

    };

    Slick.prototype.startLoad = function() {

        var _ = this;

        if (_.options.arrows === true && _.slideCount > _.options.slidesToShow) {

            _.$prevArrow.hide();
            _.$nextArrow.hide();

        }

        if (_.options.dots === true && _.slideCount > _.options.slidesToShow) {

            _.$dots.hide();

        }

        _.$slider.addClass('slick-loading');

    };

    Slick.prototype.swipeDirection = function() {

        var xDist, yDist, r, swipeAngle, _ = this;

        xDist = _.touchObject.startX - _.touchObject.curX;
        yDist = _.touchObject.startY - _.touchObject.curY;
        r = Math.atan2(yDist, xDist);

        swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) {
            swipeAngle = 360 - Math.abs(swipeAngle);
        }

        if ((swipeAngle <= 45) && (swipeAngle >= 0)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle <= 360) && (swipeAngle >= 315)) {
            return (_.options.rtl === false ? 'left' : 'right');
        }
        if ((swipeAngle >= 135) && (swipeAngle <= 225)) {
            return (_.options.rtl === false ? 'right' : 'left');
        }
        if (_.options.verticalSwiping === true) {
            if ((swipeAngle >= 35) && (swipeAngle <= 135)) {
                return 'down';
            } else {
                return 'up';
            }
        }

        return 'vertical';

    };

    Slick.prototype.swipeEnd = function(event) {

        var _ = this,
            slideCount,
            direction;

        _.dragging = false;
        _.swiping = false;

        if (_.scrolling) {
            _.scrolling = false;
            return false;
        }

        _.interrupted = false;
        _.shouldClick = ( _.touchObject.swipeLength > 10 ) ? false : true;

        if ( _.touchObject.curX === undefined ) {
            return false;
        }

        if ( _.touchObject.edgeHit === true ) {
            _.$slider.trigger('edge', [_, _.swipeDirection() ]);
        }

        if ( _.touchObject.swipeLength >= _.touchObject.minSwipe ) {

            direction = _.swipeDirection();

            switch ( direction ) {

                case 'left':
                case 'down':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide + _.getSlideCount() ) :
                            _.currentSlide + _.getSlideCount();

                    _.currentDirection = 0;

                    break;

                case 'right':
                case 'up':

                    slideCount =
                        _.options.swipeToSlide ?
                            _.checkNavigable( _.currentSlide - _.getSlideCount() ) :
                            _.currentSlide - _.getSlideCount();

                    _.currentDirection = 1;

                    break;

                default:


            }

            if( direction != 'vertical' ) {

                _.slideHandler( slideCount );
                _.touchObject = {};
                _.$slider.trigger('swipe', [_, direction ]);

            }

        } else {

            if ( _.touchObject.startX !== _.touchObject.curX ) {

                _.slideHandler( _.currentSlide );
                _.touchObject = {};

            }

        }

    };

    Slick.prototype.swipeHandler = function(event) {

        var _ = this;

        if ((_.options.swipe === false) || ('ontouchend' in document && _.options.swipe === false)) {
            return;
        } else if (_.options.draggable === false && event.type.indexOf('mouse') !== -1) {
            return;
        }

        _.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ?
            event.originalEvent.touches.length : 1;

        _.touchObject.minSwipe = _.listWidth / _.options
            .touchThreshold;

        if (_.options.verticalSwiping === true) {
            _.touchObject.minSwipe = _.listHeight / _.options
                .touchThreshold;
        }

        switch (event.data.action) {

            case 'start':
                _.swipeStart(event);
                break;

            case 'move':
                _.swipeMove(event);
                break;

            case 'end':
                _.swipeEnd(event);
                break;

        }

    };

    Slick.prototype.swipeMove = function(event) {

        var _ = this,
            edgeWasHit = false,
            curLeft, swipeDirection, swipeLength, positionOffset, touches, verticalSwipeLength;

        touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

        if (!_.dragging || _.scrolling || touches && touches.length !== 1) {
            return false;
        }

        curLeft = _.getLeft(_.currentSlide);

        _.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
        _.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

        _.touchObject.swipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curX - _.touchObject.startX, 2)));

        verticalSwipeLength = Math.round(Math.sqrt(
            Math.pow(_.touchObject.curY - _.touchObject.startY, 2)));

        if (!_.options.verticalSwiping && !_.swiping && verticalSwipeLength > 4) {
            _.scrolling = true;
            return false;
        }

        if (_.options.verticalSwiping === true) {
            _.touchObject.swipeLength = verticalSwipeLength;
        }

        swipeDirection = _.swipeDirection();

        if (event.originalEvent !== undefined && _.touchObject.swipeLength > 4) {
            _.swiping = true;
            event.preventDefault();
        }

        positionOffset = (_.options.rtl === false ? 1 : -1) * (_.touchObject.curX > _.touchObject.startX ? 1 : -1);
        if (_.options.verticalSwiping === true) {
            positionOffset = _.touchObject.curY > _.touchObject.startY ? 1 : -1;
        }


        swipeLength = _.touchObject.swipeLength;

        _.touchObject.edgeHit = false;

        if (_.options.infinite === false) {
            if ((_.currentSlide === 0 && swipeDirection === 'right') || (_.currentSlide >= _.getDotCount() && swipeDirection === 'left')) {
                swipeLength = _.touchObject.swipeLength * _.options.edgeFriction;
                _.touchObject.edgeHit = true;
            }
        }

        if (_.options.vertical === false) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        } else {
            _.swipeLeft = curLeft + (swipeLength * (_.$list.height() / _.listWidth)) * positionOffset;
        }
        if (_.options.verticalSwiping === true) {
            _.swipeLeft = curLeft + swipeLength * positionOffset;
        }

        if (_.options.fade === true || _.options.touchMove === false) {
            return false;
        }

        if (_.animating === true) {
            _.swipeLeft = null;
            return false;
        }

        _.setCSS(_.swipeLeft);

    };

    Slick.prototype.swipeStart = function(event) {

        var _ = this,
            touches;

        _.interrupted = true;

        if (_.touchObject.fingerCount !== 1 || _.slideCount <= _.options.slidesToShow) {
            _.touchObject = {};
            return false;
        }

        if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
            touches = event.originalEvent.touches[0];
        }

        _.touchObject.startX = _.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
        _.touchObject.startY = _.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

        _.dragging = true;

    };

    Slick.prototype.unfilterSlides = Slick.prototype.slickUnfilter = function() {

        var _ = this;

        if (_.$slidesCache !== null) {

            _.unload();

            _.$slideTrack.children(this.options.slide).detach();

            _.$slidesCache.appendTo(_.$slideTrack);

            _.reinit();

        }

    };

    Slick.prototype.unload = function() {

        var _ = this;

        $('.slick-cloned', _.$slider).remove();

        if (_.$dots) {
            _.$dots.remove();
        }

        if (_.$prevArrow && _.htmlExpr.test(_.options.prevArrow)) {
            _.$prevArrow.remove();
        }

        if (_.$nextArrow && _.htmlExpr.test(_.options.nextArrow)) {
            _.$nextArrow.remove();
        }

        _.$slides
            .removeClass('slick-slide slick-active slick-visible slick-current')
            .attr('aria-hidden', 'true')
            .css('width', '');

    };

    Slick.prototype.unslick = function(fromBreakpoint) {

        var _ = this;
        _.$slider.trigger('unslick', [_, fromBreakpoint]);
        _.destroy();

    };

    Slick.prototype.updateArrows = function() {

        var _ = this,
            centerOffset;

        centerOffset = Math.floor(_.options.slidesToShow / 2);

        if ( _.options.arrows === true &&
            _.slideCount > _.options.slidesToShow &&
            !_.options.infinite ) {

            _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');
            _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            if (_.currentSlide === 0) {

                _.$prevArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$nextArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - _.options.slidesToShow && _.options.centerMode === false) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            } else if (_.currentSlide >= _.slideCount - 1 && _.options.centerMode === true) {

                _.$nextArrow.addClass('slick-disabled').attr('aria-disabled', 'true');
                _.$prevArrow.removeClass('slick-disabled').attr('aria-disabled', 'false');

            }

        }

    };

    Slick.prototype.updateDots = function() {

        var _ = this;

        if (_.$dots !== null) {

            _.$dots
                .find('li')
                    .removeClass('slick-active')
                    .end();

            _.$dots
                .find('li')
                .eq(Math.floor(_.currentSlide / _.options.slidesToScroll))
                .addClass('slick-active');

        }

    };

    Slick.prototype.visibility = function() {

        var _ = this;

        if ( _.options.autoplay ) {

            if ( document[_.hidden] ) {

                _.interrupted = true;

            } else {

                _.interrupted = false;

            }

        }

    };

    $.fn.slick = function() {
        var _ = this,
            opt = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            l = _.length,
            i,
            ret;
        for (i = 0; i < l; i++) {
            if (typeof opt == 'object' || typeof opt == 'undefined')
                _[i].slick = new Slick(_[i], opt);
            else
                ret = _[i].slick[opt].apply(_[i].slick, args);
            if (typeof ret != 'undefined') return ret;
        }
        return _;
    };

}));

/*
 *  Copyright 2018 Adobe Systems Incorporated
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

   (function (element, $) {
       'use strict';
       var target = $(element),
           className = "scrolly",
           scroll,
           mobileBreakpoint = 992;

       if($(window).scrollTop() > 0) {
           target.addClass(className);
       }

       $(window).scroll(function(){

            scroll = $(window).scrollTop();
       if(scroll > 0 ) {
           target.addClass(className);
       } else {
           target.removeClass(className);
       }
    });
   }('body',jQuery));
$(function(){
'use strict';

  var contentdiv=$('div.globalheader').next().attr('id','maincontent');

  // bind a click event to the 'skip' link
  $(".skip").click(function(event){
    
    // strip the leading hash and declare
    // the content we're skipping to
    var skipTo="#"+this.href.split('#')[1];
    
   // Setting 'tabindex' to -1 takes an element out of normal 
   // tab flow but allows it to be focused via javascript
    $(skipTo).attr('tabindex', -1).on('blur focusout', function () {
    
    // when focus leaves this element, 
    // remove the tabindex attribute
     $(this).removeAttr('tabindex');
    
     }).focus(); // focus on the content container
  });  

  $('#maincontent').wrap("<main></main>");

});

// Wrap bindings in anonymous namespace to prevent collisions
jQuery(function($) {
    "use strict";

 function applyComponentStyles() {


  let navhtml="";

  $("#header-navbarbtm .cmp-navigation").not("[data-top-nav-processed='true']").each(function() {
    var nav =$(this).attr("data-top-nav-processed", true);
    navhtml+=$(this).html();

});

$("#header-navbartop .cmp-navigation").not("[data-top-nav-processed='true']").each(function() {
    var nav =$(this).attr("data-top-nav-processed", true);
    navhtml+=$(this).html();

});

    let $body = $('body');

            // Toggle Nav
          /*  $('<div id="toggleNav">' +
                 '<a href="#mobileNav" class="toggle" aria-label="mobile navigation"><i class="fa fa-bars" aria-hidden="true"></i></a>' +
                '</div>'
            ).insertAfter( ".skip" ); */
            
            $("body").prepend('<a href="#maincontent" class="skip">Skip to content</a> <div id="toggleNav">' +
                 '<a href="#mobileNav" class="toggle" aria-label="mobile navigation" aria-expanded="false"><i class="fa fa-bars" aria-hidden="true"></i></a>' +
                '</div>'
            );

         // Navigation Panel.
            $(
                '<div id="mobileNav" class="cmp-navigation--mobile">' +
                    '<nav class="cmp-navigation">' +
                        navhtml +
                    '</nav>' +
                '</div>'
            )   .insertAfter( "#toggleNav" )
                .panel({
                    delay: 500,
                    hideOnClick: true,
                    hideOnSwipe: true,
                    resetScroll: true,
                    resetForms: true,
                    side: 'left',
                    target: $body,
                    visibleClass: 'navPanel-visible'
                });
    }

  applyComponentStyles();
  
});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('.cmp-promobreaker__video .toggle-video__bottom').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.promobreakerPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Promo Breaker | Looping Video | Pause");
                videoPlayed = true;
            } else {
                videojs.players.promobreakerPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
                $(this).attr("data-analytics-button", "Promo Breaker | Looping Video | Play");
                videoPlayed = false;
            }
		});

        var promoBreakerVideoId = $(".cmp-promobreaker__video").attr("data-video-id");

        if(!(promoBreakerVideoId == null || promoBreakerVideoId == '' || promoBreakerVideoId == undefined)) {
            getVideoSchema(promoBreakerVideoId,".cmp-promobreaker-video_",".cmp-promobreaker_transcript_");
        }
    });
})(jQuery, jQuery(document));

var TAB_KEY = 9,
    SPACE_BAR = 32,
    ENTER = 13,
    ESC = 27;

var PRIMARY_NAV_CLASS = "cmp-navigation__item cmp-navigation__item--level-0",
    TOP_NAV_ACTIVE_CLASS = PRIMARY_NAV_CLASS + " openDropDownMenu",
    BOTTOM_NAV_ACTIVE_CLASS = PRIMARY_NAV_CLASS + " active",
    LIST_PARENT_CLASS_SELECTOR = ".cmp-navigation__group",
    SECONDARY_POPUP_CLOSE_BUTTON_SELECTOR = ".msdotcomr4-header--btmnav .secondary-popup .secondary-popup-close",
    FEATURED_SECTION_SELECTOR = ".secondary-popup__related",
    SECONDARY_POP_UP_SELECTOR = ".secondary-popup",
    SECONDARY_POP_UP_GRAND_CHILD_ANCHORS = ".msdotcomr4-header--btmnav .cmp-navigation__item .cmp-navigation__item--level-2 > a",
    SECONDARY_POP_UP_CHILD_SUMMARY = ".msdotcomr4-header--btmnav .secondary-popup__summary li",
    TOGGLENAV_ANCHOR = "#toggleNav a",
    topnvMenuItems = document.querySelectorAll('.msdotcomr4-header--topnav .cmp-navigation__item--level-0'),
    bottomNavMenuItems = document.querySelectorAll('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0'),
    bottomNavSecondaryItems = document.querySelectorAll('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0 .secondary-popup__links .secondary-popup__links li'),
	toggleNavMenuItems = document.querySelectorAll('.cmp-navigation--mobile .cmp-navigation__item--level-0'),
    $body = $('body'),
    $searchInputBox = $(".cmp-search__input"),
    $clearSearchText = $(".cmp-search-clear-text"),
    $searchControlButton = $(".search-control"),
    $searchHeader = $(".cmp-search--header"),
    $menuModalContent = $(".menu-modal-content"),
    timer1, timer2, anchorElement;


var mainNavMenu = (function () {

    var $menuItems = $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0 > a'),
        $topNavMenuItems = $(".msdotcomr4-header--topnav .cmp-navigation__item--level-0 > a"),
        $popupLinksList = $('.msdotcomr4-header--btmnav .secondary-popup__links .cmp-navigation__group li'),
        current = -1,
        lastScrollTop = -1,
        lastHeaderScrollTop = 0,
        headerTranslate = 0,
        $window = $(window),
        header = $(".msdotcomr4-headerpage .header"),
        scrollTimeOut = 0;

    /* Initializes */
    function init() {
        Array.prototype.forEach.call(topnvMenuItems, function (el, i) {
            if (hasSecondaryPopup(el)) {
                el.querySelector("a").setAttribute("aria-expanded", "false");
            }
        });

        Array.prototype.forEach.call(bottomNavMenuItems, function (el, i) {
            if (hasSecondaryPopup(el)) {
                el.querySelector("a").setAttribute("aria-expanded", "false");
            }
        });

        $menuItems.click(function (event) {
            openMainMenu(event, this);
            this.setAttribute("aria-expanded", "true");
            focusFirstItem(this.parentElement);
        });

        $topNavMenuItems.click(function (event) {
            if (this.parentNode.className === PRIMARY_NAV_CLASS &&
                hasSecondaryPopup(this.parentElement)) {
                this.parentNode.className = TOP_NAV_ACTIVE_CLASS;
                this.setAttribute("aria-expanded", "true");
                var secondaryPopupChildList = this.parentElement.querySelectorAll(".secondary-popup .cmp-navigation__group li");
                if (secondaryPopupChildList.length > 0) {
                    anchorElement = secondaryPopupChildList[0].querySelector("a");
                    if (anchorElement) anchorElement.focus();
                }
            }
        });

        $popupLinksList.on('mouseover', openPopupMenu);
    }

    /* Opens Bottom Nav Secondary Popup */
    function openMainMenu(e, eventData) {
        e.preventDefault();
        let currentNode;
        e && e.data && e.data.param ? currentNode = this : currentNode = eventData;
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        $(currentNode).parent().addClass('active');
        $(".msdotcomr4-header--btmnav .secondary-popup__summary li").removeClass('active');
        $(".msdotcomr4-header--btmnav .cmp-navigation__group li.cmp-navigation__item--level-1").removeClass('active');
        $(".msdotcomr4-header--btmnav .cmp-navigation__group li.cmp-navigation__item--level-1:first-child").addClass('active');

        $(".msdotcomr4-header--btmnav .secondary-popup__summary li:first-child").addClass('active');
        $menuModalContent.show();
        $searchHeader.hide();

        if ($searchControlButton.find(".fa-times").length >= 1) {
            $searchControlButton.find('i').removeClass('fa-times').addClass('fa-search');
        }

        var $getRelatedCard = $(".msdotcomr4-header--btmnav .active .secondary-popup");
        if (($getRelatedCard.children().length == 4 && !$($getRelatedCard.children()[2]).is(":visible")) || $getRelatedCard.children().length == 3) {
            $getRelatedCard.addClass('related-close');
        }

        if (!eventData) return;
        var parentListEl = eventData.parentElement,
            closeButton = parentListEl.querySelector(SECONDARY_POPUP_CLOSE_BUTTON_SELECTOR);
        if (!closeButton) return;
        closeButton.addEventListener("keydown", function (event) {
            if (event.keyCode === TAB_KEY) {
                event.preventDefault();
                if (event.shiftKey) {
                    var featuredSection = parentListEl.querySelector(FEATURED_SECTION_SELECTOR);
                    if (featuredSection) {
                        var anchorList = featuredSection.querySelectorAll("a");
                        if (anchorList.length < 1) return;
                        anchorList[anchorList.length - 1].focus();
                    } else focusElement("previous");
                } else {
                    closeSecondaryPopup(parentListEl);
                    eventData.setAttribute("aria-expanded", "false");
                    hideModal();
                    focusNextItem(parentListEl);
                    window.scrollTo(0, 0);
                }
            }
        });
    }

    /* Opens Top Nav Secondary Popup */
    function openPopupMenu(e) {
        e.preventDefault();
        $(this).siblings().removeClass("active");
        $(this).addClass('active');
        let listIndex = $(this).index();
        $('.msdotcomr4-header--btmnav .secondary-popup__summary li').removeClass('active');
        $($(this).parents('.secondary-popup').find(".secondary-popup__summary li")[listIndex]).addClass('active');
    }

    function scrollEvents() {
        if (lastScrollTop == window.pageYOffset) {
            window.requestAnimationFrame(scrollEvents);
            return false;
        } else {
            lastScrollTop = window.pageYOffset;
            stickyHeader();
        }
        window.requestAnimationFrame(scrollEvents);
    }

    function stickyHeader() {
        clearTimeout(scrollTimeOut);
        var headerHeight = header.outerHeight() + 5,
            headerScrollTop = $window.scrollTop(),
            amountScrolled = lastHeaderScrollTop - headerScrollTop,
            scrollAmount;

        headerScrollTop > 0 ? header.addClass('header-scrolling') : header.removeClass('header-scrolling');

        // Define header Y limits
        if (headerTranslate + amountScrolled < -headerHeight) {
            scrollAmount = -headerHeight;
        } else if (headerTranslate + amountScrolled > 0) {
            scrollAmount = 0;
        } else {
            scrollAmount = headerTranslate + amountScrolled;
        }

        // Animate header with scroll
        header.css('transform', 'translate3d(0,' + scrollAmount + 'px,0)');
        $("#toggleNav").css('transform', 'translate3d(0,' + scrollAmount + 'px,0)');
        header.attr('data-translated', scrollAmount);

        // Detect scroll end
        clearTimeout($.data(this, 'scrollTimer'));
        $.data(this, 'scrollTimer', setTimeout(function () {
            lastHeaderScrollTop = headerScrollTop;
            headerTranslate = parseFloat(header.attr('data-translated'));
        }, 250));

        if (headerScrollTop > 0) {
            scrollTimeOut = setTimeout(function () {
                header.css('transform', 'translate3d(0,-120px,0)').css('transition', '0.5s');
                $("#toggleNav").css('transform', 'translate3d(0,-100px,0)').css('transition', '0.5s');
            }, 2500);
        } else {
            header.css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
            $("#toggleNav").css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
        }
    }

    return {
        init: init,
        openMainMenu: openMainMenu,
        scrollEvents: scrollEvents()
    };
})();

/**
 * On Page load
 */
$(document).ready(function () {
    mainNavMenu.init();

    $searchControlButton.on("click", function () {
        $searchHeader.toggle();
        $searchInputBox.focus();
        $searchControlButton.attr("aria-expanded") === "false" ? 
            $searchControlButton.attr("aria-expanded", "true") : $searchControlButton.attr("aria-expanded", "false");
        $(this).find('i').toggleClass('fa-times');
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        $searchControlButton.find(".fa-times").length >= 1 ? $menuModalContent.show() : $menuModalContent.hide();
    });

    $($(".stay-upto-date")[1]).text($($(".stay-upto-date")[1]).text().toLowerCase());

    /* Enabled Navigation for Shift+Tab key press  */
    const searchIcon = document.querySelector('.search-control');
    $(".search-control").on('keyup blur', function (e) {
        if (e.shiftKey) {
            if (searchIcon === document.activeElement) {
                $(".header").css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
                $("#toggleNav").css('transform', 'translate3d(0,0px,0)').css('transition', '0.5s');
            }
        }
    });

    /**
     *  Triggers on Click on Bottom Nav Secondary Popup close button
     */
    $(".msdotcomr4-header--btmnav .secondary-popup-close").on("click", function (e) {
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false");
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        window.scrollTo(0, 0);
        hideModal();
        resetSearchBox();
        focusElement("previous");
    });

    $body.click(function () {
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false");
        $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
        hideModal();
        resetSearchBox();
        var $topNavActiveItem = $(".openDropDownMenu"),
            $topNavActiveItemLink = $(".openDropDownMenu > a");
        if (!$topNavActiveItemLink.is($(event.target))) {
            $topNavActiveItemLink.attr("aria-expanded", "false");
            $topNavActiveItem.removeClass("openDropDownMenu");
        }
    });

    $(".msdotcomr4-header--btmnav, .cmp-search--header").click(function (e) {
        e.stopPropagation();
    });

    var $moreInsightsItem = $(".composite-container.more-insights__section .composite-container__section");
    $($moreInsightsItem[$moreInsightsItem.length - 1]).css("margin-bottom", "0px");

    $searchInputBox.on('keydown', function (e) {
        $(this).val().length > 0 ? $clearSearchText.show() : $clearSearchText.hide();
        if (e.keyCode === ESC) {
            e.preventDefault();
            hideModal();
            resetSearchBox();
            $searchControlButton.focus();
        } else if (e.keyCode === TAB_KEY) {
            e.preventDefault();
            if(event.shiftKey) {
                hideModal();
                resetSearchBox();
                $searchControlButton.focus();
            } else focusElement("next");
        }
    });

    $clearSearchText.on("click", function () {
        $searchInputBox.val('').focus();
        $(this).hide();
    });

    $clearSearchText.on('keyup', function (e) {
        if (e.which == ENTER) { //Enter key 
            $clearSearchText.click(); //Trigger click event
        }
    });

    $(".cmp-navigation--mobile .cmp-navigation__item.cmp-navigation__item--level-0").on("click", function (event) {

        var sibling;
        if (this.nextElementSibling) {
            sibling = this.nextElementSibling;
        } else {
            sibling = this.previousElementSibling;
        }
        if ($(sibling).is(':visible') || sibling == null) {
            event.stopPropagation();
            $(this).find(".secondary-popup").show();
            focusElement("next");
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().addClass('active').attr("aria-expanded", "true");
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().not($(this)).addClass('inactive').removeClass('active').attr("aria-expanded", "false");
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").addClass('inactive');
            $(".cmp-navigation__item--level-0 > .fa-angle-down").addClass('inactive');
        }

    });

    $(".cmp-navigation--mobile .mobile-goback-arrow").on("click", function (event) {
        event.stopPropagation();
        event.preventDefault();
        $(".cmp-navigation--mobile .secondary-popup").hide();
        $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().removeClass('inactive').removeClass('active').attr("aria-expanded", "false");
        $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").removeClass('inactive').removeClass('active').attr("aria-expanded", "false");
        $(".cmp-navigation__item--level-0 > .fa-angle-down").removeClass('inactive').removeClass('active').attr("aria-expanded", "false");

    });

    $('.cmp-navigation--mobile .mobile-goback-arrow').keypress(function(e) {
        if(e.which == 13 || e.which == 32) {//Enter key pressed
             event.stopPropagation();
            event.preventDefault();
            $(".cmp-navigation--mobile .secondary-popup").hide();
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").parent().removeClass('inactive').removeClass('active').attr("aria-expanded", "false");
            $(".cmp-navigation__item--level-0 > .cmp-navigation__item-link").removeClass('inactive').removeClass('active').attr("aria-expanded", "false");
            $(".cmp-navigation__item--level-0 > .fa-angle-down").removeClass('inactive').removeClass('active').attr("aria-expanded", "false");
            focusElement("previous");
         }
    });

    $(".msdotcomr4-header--btmnav .cmp-navigation__item--level-0 > .fa-angle-down").css('display', 'none');

    $("#toggleNav").on("click", function (e) {
        e.preventDefault();
        hideModal();
        resetSearchBox();
    });
    $("#toggleNav").keydown(function (e) {
        if (e.keyCode == 32) {            
            $('body').toggleClass('navPanel-visible');
            $('#toggleNav i').toggleClass('hamburger-close');
            $('#toggleNav a').attr('aria-expanded', function (i, attr) {
                return attr == 'true' ? 'false' : 'true'
             });
            e.preventDefault();
        }
    });
	
	/**
	* On click of skip focus on the main content
	**/
	$(".skip").on("click", function (e) {
		$('.search-control').focus();
		 focusElement("next");
	})
    /**
     *  Triggers on Bottom Nav Secondary Popup on Escape 
     */
    $(document).on('keydown', function (e) {
        if (e.keyCode === ESC) { // ESC
            $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0.active > a').attr("aria-expanded", "false").focus();
            $('.msdotcomr4-header--btmnav .cmp-navigation__item--level-0').removeClass('active');
            // window.scrollTo(0, 0);
            hideModal();
            resetSearchBox();
            var $topMenuDropDownActiveItemLink = $(".openDropDownMenu > a");
            if ($topMenuDropDownActiveItemLink.length > 0 && !$topMenuDropDownActiveItemLink.is($(e.target))) {
                $topMenuDropDownActiveItemLink.attr("aria-expanded", "false");
                $topMenuDropDownActiveItemLink.parent().removeClass("openDropDownMenu");
            }
        }
       if(e.keyCode === TAB_KEY) {
            if(e.shiftKey) {
                if($("#toggleNav a").attr("aria-expanded") === "false" ) {
                    if($('.logo-link').is(":focus")) {
                        focusElement("previous");
                        $('.cmp-navigation--mobile .cmp-navigation__item--level-0').first().children('a').focus();
                    }
                    if($('#toggleNav a').is(":focus")) {
                        $('#toggleNav a').focus();
                    }
                }
                else {
                    if($('#toggleNav a').is(":focus")) {
                        $('.cmp-navigation--mobile .cmp-navigation__item--level-0').last().children('a').focus();
                        focusElement("next");
                    }
                }
            }
            else { 
                if($("#toggleNav a").attr("aria-expanded") === "true") {
                    if($('.cmp-navigation__item--level-0.active .secondary-popup').css('display') == 'block') {
                        let toggleNavele = document.querySelector('.cmp-navigation__item--level-0.active .secondary-popup__links ');
                        trapFocus(toggleNavele);
                    }
                    else {
                        if($('.cmp-navigation--mobile .cmp-navigation__item--level-0').last().children('a').is(":focus")) {
                            $('.skip').focus();
                        }
                    }
                }
                else {
                    if($('#toggleNav a').is(":focus")) {
                        focusElement("next");
                        $('.cmp-navigation--mobile .cmp-navigation__item--level-0').last().children('a').focus();
                    }
                }
            }
        } 
    });

    /**
     *  focus trap  within the content
     */
    function trapFocus(element) {
        var focusableEls = element.querySelectorAll('a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])'),
            firstFocusableEl = focusableEls[0];  
            lastFocusableEl = focusableEls[focusableEls.length - 1];
        element.addEventListener('keydown', function(e) {
            var isTabPressed = (e.key === 'Tab' || e.keyCode === TAB_KEY);
    
            if (!isTabPressed) { 
                return; 
            }
    
            if ( e.shiftKey ) /* shift + tab */ {
                if (document.activeElement === firstFocusableEl) {
                    lastFocusableEl.focus();
                    e.preventDefault();
                }
            } else /* tab */ {
                if (document.activeElement === lastFocusableEl) {
                    firstFocusableEl.focus();
                    e.preventDefault();
                }
            }
    
        });
    }

    /**
     *  Listens event on Top Nav Menubar and handles accessibility
     */
    Array.prototype.forEach.call(topnvMenuItems, function (el, i) {
        /**
         * Listens event on Top Nav Secondary Popup and handles accessibility
         */
        Array.prototype.forEach.call(el.querySelectorAll(".secondary-popup li"), function (element, i) {
            if (element.querySelector("a")) {
                element.querySelector("a").addEventListener("keydown", function (event) {
                    if (event.keyCode === TAB_KEY) {
                        event.preventDefault();
                        if (event.shiftKey) {
                            if (this.parentElement === this.parentElement.parentElement.firstElementChild) {
                                el.className = PRIMARY_NAV_CLASS;
                                resetAriaExpanded(el);
                            }
                            focusElement("previous");
                        } else {
                            if (this.parentElement === this.parentElement.parentElement.lastElementChild) {
                                el.className = PRIMARY_NAV_CLASS;
                                resetAriaExpanded(el);
                            }
                            focusElement("next");
                        }
                    } else if (event.keyCode === ESC) {
                        event.preventDefault();
                        el.className = PRIMARY_NAV_CLASS;
                        resetAriaExpanded(el);
                        focusElement("previous");
                    }
                });
            }
        });
    });

    /**
     * Listens event on Bottom Nav Menubar and handles accessibility
     */
    Array.prototype.forEach.call(bottomNavMenuItems, function (el, i) {
        el.querySelector('a').addEventListener("keydown", function (event) {
            bottomNavHeaderLinkListener(el);
            if (event.keyCode === TAB_KEY) {
                event.preventDefault();
                closeSecondaryPopup(el);
                hideModal();
                if (event.shiftKey) {
                    resetAriaExpanded(el);
                    focusPreviousItem(el);                    
                } else {
                    resetAriaExpanded(el);
                    focusNextItem(el);
                }
            }
        });
    });
});

/**
 * Sets the listener for Bottom Nav Secondary Popup Header Link
 * @param {*} currentNavElement 
 */
function bottomNavHeaderLinkListener(currentNavElement) {
    bottomNavHeaderLink = $(currentNavElement).find(".secondary-popup__links a") [0];
    if(!bottomNavHeaderLink) return;
    bottomNavHeaderLink.addEventListener("keydown", bottomNavHeaderLinkKeyDownListener);

}

/**
 * Listens on the Tab press on Bottom Nav Secondary Popup Header Link
 * @param {*} event 
 */
function bottomNavHeaderLinkKeyDownListener(event) {
    var key = event.keyCode;
        parentBottomNavElement = findAncestor(this, "cmp-navigation__item--level-0");
    switch (key) {
        case TAB_KEY:
            event.preventDefault();            
            if(event.shiftKey) {
                closeSecondaryPopup(parentBottomNavElement);
                hideModal();
                resetAriaExpanded(parentBottomNavElement);
                focusElement("previous");
            } else {
                focusElement("next");
            }
    }
}

/**
 * Listens tab event on Bottom Nav Secondary Popup and handles accessibility
 */
$.each($('.msdotcomr4-header--btmnav .cmp-navigation__item.cmp-navigation__item--level-1 > a'), function (key, val) {
    $(this).on("keyup", function (e) {
        e.preventDefault();

        $(this).parent().siblings().removeClass("active");
        window.scrollTo(0, 0);
        $(this).parent().addClass('active');
        let listIndex = $(this).parent().index();
        $(SECONDARY_POP_UP_CHILD_SUMMARY).removeClass('active');
        $($(this).parents('.secondary-popup').find(".secondary-popup__summary li")[listIndex]).addClass('active');

        var popupHeight = $(".cmp-navigation__item.cmp-navigation__item--level-0.active .secondary-popup");
        var itemsPosition = $(document.activeElement).position().top;

        var itemCurrentPosition = popupHeight.height() - itemsPosition;
        if (popupHeight.height() > 555) {
            var itemCurrentPosition = popupHeight.height() - itemsPosition;
            if (itemCurrentPosition < 250) {
                window.scrollTo(0, 60);
            }
        }

    });
});

/**
 * Added listeners on focus on the Secondary Popup Grand Children
 */
$.each($(SECONDARY_POP_UP_GRAND_CHILD_ANCHORS), function () {
    this.addEventListener("focus", handleFocusOnSecondaryPopupGrandChildren, true);
});


function resetSearchBox() {
    $searchHeader.hide();
    $searchControlButton.find('i').removeClass('fa-times').addClass('fa-search');
    $searchControlButton.attr("aria-expanded", "false");
    $searchInputBox.val('');
}

/**
 * Checks if element has secondary popup
 * @param {*currentListElement} currentListElement 
 */
function hasSecondaryPopup(currentListElement) {
    return currentListElement.querySelector(SECONDARY_POP_UP_SELECTOR) != undefined || null ? true : false;
}
/**
 * Handles the on focus functionality on Secondary Popup Grand Children
 */
function handleFocusOnSecondaryPopupGrandChildren() {
    let secondaryPopUpChild = findAncestor(this, "cmp-navigation__item--level-1"),
        $secondaryPopUpChild;
    if (!secondaryPopUpChild) return;
    $secondaryPopUpChild = $(secondaryPopUpChild);
    if ($secondaryPopUpChild.hasClass("active")) return;
    $secondaryPopUpChild.siblings().removeClass("active");
    $secondaryPopUpChild.addClass("active");
    let listIndex = $secondaryPopUpChild.index(),
        secondaryPopup = findAncestor(this, "secondary-popup"),
        $summaryList = $(secondaryPopup).find(".secondary-popup__summary li");
    if (!$summaryList.length || listIndex > $summaryList.length - 1) return;
    $summaryList.removeClass("active");
    $($summaryList[listIndex]).addClass("active");
}

/**
 * Finds out the ancestor of the current element based on the class name
 * @param {*Current element} el 
 * @param {*Ancestor className} cls 
 */
function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

/**
 * Focuses the target position of the current active element
 * @param {*Focus Position, expected values are 'previous' or 'next'} position 
 */
function focusElement(position) {
    //add all elements we want to include in our selection
    var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
    if (document.activeElement) {
        var focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements),
            function (element) {
                //check for visibility while always include the current activeElement 
                return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
            });
        var index = focussable.indexOf(document.activeElement);
        if (index > -1) {
            var targetElement;
            if (position === "next" && index < focussable.length) {
                targetElement = focussable[index + 1] || focussable[0];
            }
            if (position === "previous" && index > 0) {
                targetElement = focussable[index - 1] || focussable[0];
            }
            if (targetElement) targetElement.focus();
        }
    }
}

/**
 * Focuses the next focussable element
 * @param {*currentElement - Current Element} el 
 */
function focusNextItem(el) {
    el === el.parentElement.lastElementChild ? focusElement("next") : focusAnchorElement(el.nextElementSibling);
}

/**
 * Focuses the previous focussable element
 * @param {*currentElement - Curren Element} el 
 */

function focusPreviousItem(el) {
    el === el.parentElement.firstElementChild ? focusElement("previous") : focusAnchorElement(el.previousElementSibling);
}

/**
 * Focuses the first item of the parent UL class
 * @param {*currentListElement - Current List Element} currentListElement 
 */
function focusFirstItem(currentListElement) {
    var listParent = currentListElement.querySelector(LIST_PARENT_CLASS_SELECTOR);
    if (listParent && listParent.childElementCount > 0) {
        focusAnchorElement(listParent.firstElementChild);
    }
}

/**
 * Focuses the underlying anchor under the target element
 * @param {*targetElement - Target Element} activeElement 
 */
function focusAnchorElement(activeElement) {
    anchorElement = activeElement.querySelector("a");
    if (anchorElement) anchorElement.focus();
}

/**
 * Closes teh active secondary popup of the activeElement
 * @param {*currentActiveElement - Current Active Element} activeElement 
 */
function closeSecondaryPopup(activeElement) {
    if (activeElement.classList.contains("active")) {
        activeElement.className = PRIMARY_NAV_CLASS;
    }
}

/**
 * Resets the aria-expanded attribute of the activeElement
 * @param {*currentActiveElement - Current Active Element} activeElement 
 */
function resetAriaExpanded(currentListElement) {
    anchorElement = currentListElement.querySelector("a");
	if (anchorElement && anchorElement.getAttribute("aria-expanded") === "true") anchorElement.setAttribute("aria-expanded", "false");
}

/**
 * Hides the secondary popup modal
 */
function hideModal() {
    $menuModalContent.hide();
}
jQuery(function ($) {
    "use strict";
    $(".cmp-search__clear").hide();
    var count = 0;
    $(".cmp-search__input").keypress(function () {
        count = count + 1;
        if (count > 0)
            $(".cmp-search__clear").show();
        else
            $(".cmp-search__clear").hide();

    });

    $(".cmp-search__clear").click(function () {
        $(".cmp-search__input").val("");
    });


});
(function ($, $document) {

    "use strict";

	var cardSelectors = ".add-grid-class";
	var GRID_CLASSES = "gridclasses";

	/* Adds the Grid Classes to the Parent Div on page refresh */
    $document.ready(function() {
			var cardsList = $document.find(cardSelectors);
            if(!cardsList || cardsList.length === 0) return;
			$.each(cardsList, function(index, card) {
                var gridClasses = $(card).data(GRID_CLASSES);
                var $parent = $(card).parent();
                $parent = removeGridClasses($parent);
				$parent.addClass(gridClasses);
            });
    });

    /* Add Remove existing Grid Classes if any */
    function removeGridClasses($element) {
        $element.removeClass(function(index, className) {
            return (className.match(/(^|\s)aem-\S+/g) || []).join(' ');
        });
        return $element;
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
  "use strict";

  var x = window.matchMedia("(max-width: 767px)");//small screen
  x.addListener(wwdConfig); 
  wwdConfig(x); //initial call once

  function wwdConfig(x) {

    var i, tabcontents, tablinks, wcmmode;
      tablinks = $(".cmp-whatwedolist-left :button.whatwedo__button");
      tabcontents =$(".cmp-whatwedolist--content-section");
      wcmmode=getCookie('wcmmode');  

    if (x.matches) {
      $(".cmp-whatwedolist-left").css('min-height','0px');	
      //in mobile view port
      tabcontents.css("display","none");
      tablinks.removeClass("active");
      tablinks.blur();

      tablinks.off('click').on('click', function(event){
          event.stopPropagation();
          tablinks.removeClass("active");


          var sid =event.currentTarget.id;
          $(event.currentTarget).addClass("active");
          $('div[data-id="' + sid + '-content"] > .cmp-whatwedolist__link a.cmp-list__item-link')[0].click();
      });
    } else {
    	/*var height = $(".whatwedoteaser img").height();
        $(".cmp-whatwedolist-left").css('min-height',height);*/
      //in non-mobile view
        if(!wcmmode||(wcmmode&&wcmmode!=='edit')){  
          tabcontents.css("display","none");
        //tabcontents.slice(1).css("display","none");
          tablinks.removeClass("active");
          tablinks.attr("tabindex", "-1");
          tablinks.attr("aria-selected", "false");
          //if no active item
          if(tablinks.find('.active').length == 0){
              tabcontents.first().css("display","grid").css("display", "-ms-grid");

              tablinks.first().addClass("active");
              tablinks.first().attr("tabindex", "0");
            tablinks.first().attr("aria-selected", "true");
          //  tablinks.first().focus();
          }//endif
        }//endif

      tablinks.off('click').on('click', function(event){
          event.stopPropagation();
          tablinks.removeClass("active");
          tablinks.attr("tabindex", "-1");
          tablinks.attr("aria-selected", "false");
          tabcontents.css("display","none");

          var sid =event.currentTarget.id;
          $(this).addClass("active");
          $(this).attr("tabindex", "0");
          $(this).attr("aria-selected", "true");
          $('div[data-id="' + sid + '-content"]').css("display","grid").css("display", "-ms-grid");
		 /*if (detectIEEdge()) {		        
		    let maxheight = $("div.cmp-whatwedolist-right").height();		           
		    $(".cmp-whatwedolist-left").css('height',maxheight);		      
		  }//IE*/
      });

    }//end else

  }//end function

 /*$(window).resize(function () {
      // alert('resize');
   var width = $(".whatwedoteaser img").width();
       if(width && width > 767)   { 
           var height = $(".whatwedoteaser img").height();
           $(".cmp-whatwedolist-left").css('min-height',height);

           if (detectIEEdge()) {
                let maxheight = $("div.cmp-whatwedolist-right").height();                
                $(".cmp-whatwedolist-left").css('height',maxheight);
           }//IE
       }
 });*/

  function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }


  /**
 * detect IEEdge
 * returns version of IE/Edge or false, if browser is not a Microsoft browser
 */
	function detectIEEdge() {
	    var ua = window.navigator.userAgent;

	    var msie = ua.indexOf('MSIE ');
	    if (msie > 0) {
	        // IE 10 or older => return version number
	        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
	    }
	
	    var trident = ua.indexOf('Trident/');
	    if (trident > 0) {
	        // IE 11 => return version number
	        var rv = ua.indexOf('rv:');
	        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
	    }

	    var edge = ua.indexOf('Edge/');
	    if (edge > 0) {
	       // Edge => return version number
	       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
	    }
	
	    // other browser
	    return false;
	 } 

});
(function ($, $document) {

    var WHAT_WE_DO_LIST_SELECTOR = ".cmp-whatwedolist",
        WHAT_WE_DO_TAB_BUTTONS_SELECTOR = ".cmp-whatwedolist-left :button.whatwedo__button",
        WHAT_WE_DO_TAB_CONTENTS_SELECTOR = ".cmp-whatwedolist--content-section",
        WHAT_WE_DO_TAB_BUTTON_LIST_ITEM_CLASS = "cmp-list__item",
        WHAT_WE_DO_LIST_PARENT_CLASS = "cmp-whatwedolist-left",
        ACTIVE_CLASS = "active",
        ARIA_SELECTED_ATTR = "aria-selected",
        TAB_INDEX = "tabindex",
        WCMMODE = "wcmmode",
        WCMMODE_EDIT = "edit",
        $tabButtons, $tabContents, $targetButton, wcmmode;

    var keys = {
        end: 35,
        home: 36,
        up: 38,
        down: 40
    };

    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        wcmmode = getWcmmode($(WHAT_WE_DO_LIST_SELECTOR));
        /* Accessibility enabled only for disabled or preview mode */
        if (!wcmmode || wcmmode === WCMMODE_EDIT) return;
        var mobileViewPort = window.matchMedia("(max-width: 767px)");
        /* Applies only for non-mobile device */
        if (mobileViewPort.matches) return;
        $tabButtons = $(WHAT_WE_DO_TAB_BUTTONS_SELECTOR);
        $tabContents = $(WHAT_WE_DO_TAB_CONTENTS_SELECTOR);
        if (!$tabButtons.length || !$tabContents.length) return;
        focusTargetTab($tabButtons.first(), false);
        if ($tabButtons.length < 2) return;
        $tabButtons.each(function (index) {
            addListeners(this);
        });
    });

    /* Enables Event Listener for all the tabs */
    function addListeners(tab) {
        tab.addEventListener("keydown", keydownEventListener);
    }

    /* Keydown Event Listener */
    function keydownEventListener(event) {        
        var key = event.keyCode,
            tabListParent = findAncestor(this, WHAT_WE_DO_LIST_PARENT_CLASS),
            currentListElement = findAncestor(this, WHAT_WE_DO_TAB_BUTTON_LIST_ITEM_CLASS);

        switch (key) {
            case keys.down:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                if (tabListParent.lastElementChild === currentListElement) {
                    focusTargetTab($tabButtons.first(), true);
                } else {
                    var currentButtonIndex = $tabButtons.index(this);
                    focusTargetTab($($tabButtons[currentButtonIndex + 1]), true);
                }
                break;
            case keys.up:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                if (tabListParent.firstElementChild === currentListElement) {
                    focusTargetTab($($tabButtons[$tabButtons.length - 1]), true);
                } else {
                    var currentButtonIndex = $tabButtons.index(this);
                    focusTargetTab($($tabButtons[currentButtonIndex - 1]), true);
                }
                break;
            case keys.home:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                focusTargetTab($tabButtons.first(), true);
                break;
            case keys.end:
                event.preventDefault();
                setAriaAttribute($(this), ARIA_SELECTED_ATTR, "false");
                focusTargetTab($tabButtons.last(), true);
                break;
        }
    }

    /* Sets the aria attributes */
    function setAriaAttribute(targetElement, attribute, attributeValue) {
        if (!targetElement) return;
        targetElement.attr(attribute, attributeValue);
    }

    /* Activates the tab by adding active class */
    function activateTab($targetItem) {
        if (!$targetItem) return;
        $tabButtons.removeClass(ACTIVE_CLASS);
        $targetItem.addClass(ACTIVE_CLASS);
    }

    /* Shows the mapped tab content as per the tab id */
    function activateTabContent(targetId) {
        $tabContents.css("display", "none");
        $tabContents.filter('div[data-id="' + targetId + '-content"]').css("display", "grid").css("display", "-ms-grid");
    }

    /* Sets the tabindex to the target element */
    function setTabIndex($targetItem) {
        $tabButtons.attr(TAB_INDEX, "-1");
        $targetItem.attr(TAB_INDEX, "0");
    }

    /* Finds the ancestor of a particular class */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    /* Focuses the target tab and displays the target tab content */
    function focusTargetTab($targetButtonElement, focusTargetButtonElement) {
        activateTab($targetButtonElement);
        $tabButtons.attr(ARIA_SELECTED_ATTR, "false");
        setAriaAttribute($targetButtonElement, ARIA_SELECTED_ATTR, "true");
        setTabIndex($targetButtonElement);
        activateTabContent($targetButtonElement.attr("id"));
        if (focusTargetButtonElement) $targetButtonElement.focus();
    }

    /* Gets the Wcmmode of the page */
    function getWcmmode($targetElement) {
        if (!$targetElement) return;
        return $targetElement.data(WCMMODE);
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
    "use strict";

    function updateAnalytics(){

       // var carlistcont = $('.cmp-container.whatwedolist-cardlist-container');
         var carlistcont = $('[data-comp-name]');

        /*loop each container*/
        carlistcont.each(function(){
            var size=$(this).find('.r4card').length;

            var comp_name=$(this).attr('data-comp-name');
            var ctn_name=$(this).attr('data-ctn-name');

             /*loop each card*/
            $(this).find('.r4card a').each(function(index){
                var analytic_link_tag = $(this).attr('data-analytics-link');
                var analytic_module_tag = $(this).attr('data-analytics-module');

                if(typeof analytic_module_tag !== "undefined"){
                    analytic_module_tag+= ' | Position '+(index+1)+' Of '+size; 
                    $(this).attr('data-analytics-module', analytic_module_tag);
                }else{
                     //do nothing
                    //$(this).attr('data-analytics-module', 'Card | Position '+(index+1)+' Of '+size );

                }

                if(typeof analytic_link_tag !== "undefined"){
                    analytic_link_tag = comp_name + ' | Selection Module | '+ ctn_name + ' | '+ analytic_link_tag; 
                    $(this).attr('data-analytics-link', analytic_link_tag);
                }else{
                     //do nothing
                    //$(this).attr('data-analytics-link',comp_name+' | '+ctn_name+ ' | ');

                }
    
            });
         });
    }

    updateAnalytics();
});
/**
 * This file will add data analytics attributes to all the cards, based on Two Up, Three Up, and Four Up Section.
**/

(function ($, $document) {

    "use strict";

    var sectionSelectors = [".two-up__style", ".three-up__style", ".four-up__style"],
        CARD_SELECTOR = ".r4card",
        SECTION_TITLE_SELECTOR = ".cmp-title__text",
        BAR_SEPARATOR = " | ",
        DATA_ANALYTICS_LINK = "data-analytics-link",
        DATA_ANALYTICS_MODULE = "data-analytics-module",
        PRESS_RELEASE_CARD_IDENTIFIER = "cmp-pressreleasecard",
        PRESS_RELEASE_CARD_COLORBOX_SELECTOR = ".cmp-pressreleasecard__colorbox";


    $document.ready(function () {
        $.each(sectionSelectors, function (index, sectionSelector) {
            var $sections = $document.find(sectionSelector);
            if (!$sections) return;
			$.each($sections, function (index, section) {
                var $section = $(section),
                	sectionTitle = getSectionTitle($section),
                    cardList = $section.find(CARD_SELECTOR);
                if (!cardList) return;
                addCardPositionClass(cardList);

                sectionTitle = sectionTitle ? sectionTitle : "NA";
                addAnalyticsAttributes(cardList, sectionTitle);
            });
        });
    });

    /* Get the title of the Two Up or Three Up or Four Up section */
    function getSectionTitle($section) {

        var $titleElem = $section.find(SECTION_TITLE_SELECTOR);
        if (!$titleElem) return;
        return $titleElem.text();
    }

    /* Adds the required Analytics Attributes */
    function addAnalyticsAttributes(cardList, sectionTitle) {
        var count = 0;
        $.each(cardList, function (index, card) {
            count++;
            var $card = $(card), $cardLink;
            if ($card.hasClass(PRESS_RELEASE_CARD_IDENTIFIER)) {
                $cardLink = $card.find(PRESS_RELEASE_CARD_COLORBOX_SELECTOR);
            } else $cardLink = $card.find("a");
            if (!$cardLink) return;
            var analyticsLinkValue = $cardLink.attr(DATA_ANALYTICS_LINK),
                totalCards = cardList.length, column;
            column = totalCards >= 4 ? 4 : totalCards;
            if ($card.hasClass("cmp-videocard") && analyticsLinkValue){
                var videocard_eyebrow = $card.find(".cmp-videocard__eyebrow");
                videocard_eyebrow = videocard_eyebrow.text().trim(); 
                setAnalyticsAttribute($cardLink, DATA_ANALYTICS_LINK, sectionTitle + BAR_SEPARATOR +
                                      column + "-Card Module" + BAR_SEPARATOR + "Video Card" + BAR_SEPARATOR + analyticsLinkValue +
                                      BAR_SEPARATOR + "Eyebrow" + BAR_SEPARATOR + videocard_eyebrow);
            }else if (analyticsLinkValue) {
                setAnalyticsAttribute($cardLink, DATA_ANALYTICS_LINK, sectionTitle + BAR_SEPARATOR +
                                      column + "-Card Module" + BAR_SEPARATOR + analyticsLinkValue);
            }
            var analyticsModuleValue = $cardLink.attr(DATA_ANALYTICS_MODULE);

            if (analyticsModuleValue) {

                setAnalyticsAttribute($cardLink, DATA_ANALYTICS_MODULE, analyticsModuleValue + BAR_SEPARATOR
                    + "Position " + count + " of " + totalCards);
            }
        });
    }


    /* Sets the attribute */
    function setAnalyticsAttribute($cardLink, attributeKey, attributeValue) {

        $cardLink.each(function (index, element) {
            $(element).attr(attributeKey, attributeValue);
        });
    }

    /* Sets position class to the card */
    function addCardPositionClass(cardList) {
        $.each(cardList, function (index, card) {
            index ++;
            $(card).addClass("card-position-" + index);
        });
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
    $(".cmp-body__desc a").each(function(index) {
        var sectionTitle;
        if($(this).closest('.bodytext').prev('.sectiontitle').length !== 0) {
            sectionTitle = $(this).closest('.bodytext').prev('.sectiontitle').find('.section_title').text();
        } else {
			sectionTitle = "NA";
        }
        $(this).attr("data-analytics-link",sectionTitle.trim() + " | In-line Body Text Link | " + $(this).text().trim());
    });
});

$(document).ready(function() {

$('.cmp__facts-carousel').each(function(index) {
    var $factsCarousel = $('.facts-carousel__container');
    var title_facts = $(this).find(".facts__title-container .facts__title").text();
	
    $factsCarousel.slick({
        arrows: true,
        slidesToShow: 1,
        infinite: true,
        dots: true,
        accessibility: false
    });
	
    $(this).find(".slick-prev").attr("data-analytics-button", title_facts+" | Carousel Left");
    $(this).find(".slick-next").attr("data-analytics-button", title_facts+" | Carousel Right");

    });

});
;(function ($, $document) {

    "use strict";

    $document.ready(function () {

        $('.falocator').on('submit', validateZip);
        $(".falocator input").on('keydown', function (e) {
            if ($(this).val().length > 0 && $(this).hasClass("error") && e.which !== 13) {
            	$(this).removeClass("error");
                $(this).parent().find('.error-message').css({ 'display': 'none' });
            }
        });

        setTimeout(function () {
			$.each($(".input-wrapper input"), function (key, val) {
                let currentId = $(this).attr('id'),
                	errorMsgId = $(".error-message").attr('id');
                $(this).next('label').next('button').next('p').attr("id", errorMsgId + key);
                $(this).attr("id", currentId + key);
                $(this).next('label').attr("for", currentId + key);
                let textLength = $(this).val().length;
                if (textLength > 0) {
                    $(this).next('label').addClass("show");
                }
            });

            $(".input-wrapper input").each(function (index) {
            	$(this).on("keyup", function (e) {
                    let labelText = $(this).next("label");
                    if($(this).val().length > 0) {
            		    labelText.addClass("show");
            	    } else {
            		    labelText.removeClass("show");
            	    }
                });
            });
    	}, 1000);
    });

    function validateZip() {
        let $input = $(this).find('input'),
            $errorMessage = $(this).find('.error-message'),
            inputVal = $input.val();

        if(inputVal.match(/(^\d{5}$)|(^\d{5}-\d{4}$)/) === null || (inputVal.length > 0 && inputVal.length < 5)) {
            $(this).find('input').addClass('error');
            $errorMessage.css({'display': 'block'});

            $input.on('keyup', function (e) {
                if ($(this).val().length > 0 && $(this).hasClass("error") && e.which !== 13) {
                    $(this).removeClass("error");
                    $errorMessage.css({ 'display': 'none' });
                }
            });
            return false;
        }
    }

})(jQuery, jQuery(document));
$(document).ready(function() {

    var zipRadius = $('#zipRadius').val();
    var zipRadiusKM = zipRadius * 1.60934;
    var investmentNeeds = [];
    var languages = [];
    var fadataJSON = "/content/dam/msdotcom/appdata/fa-matchbook.json?v="+Math.round(Math.random() * 1000);
    var loadingImg = "<div class='fa-notfound'><img src='/content/dam/msdotcom/img/fa-matchbook/indicator.gif' alt='Loading' width='16' height='16'></div>";
    var notFound = "<div class='fa-notfound'>Your search criteria has returned no results.</div>";
    var disclaimer = "";
    var matched = [];
    var fadata = '';
    var curPage = 1;
    var perPage = 6;

    // On window resize rearrange the result;
    var screenWidth = $(window).width();
    $(window).resize(function(){
        let zipcode = $(".branch-locator-form .input-wrapper input").val();
        if(zipcode){
			fadata = '';
            $("#famatch").click();
        }
     });
    
    $("#specialty").val($("#investmentNeeds").val());

    if ($('#languages').val()) {
        languages = $('#languages').val().split(',');
        for (i in languages) { languages[i] = parseInt(languages[i], 10); }
    }

    function isSubset(needles, haystack){
        for(var i = 0 , len = needles.length; i < len; i++){
            if(jQuery.inArray(needles[i], haystack) == -1) return false;
        }
        return true;
    }

    function shuffle(array) {
        //The Fisher-Yates (aka Knuth) shuffle
        //https://github.com/coolaj86/knuth-shuffle
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function showPage() {
        var cardCount = 0;
        var showLink = 0;
        var startMatch = (curPage - 1) * perPage;
        var endMatch = (matched.length >= curPage * perPage)?curPage * perPage:matched.length;
        console.log('matched: '+matched.length+', curPage: '+curPage+', perPage: '+perPage+', startMatch: '+startMatch+', endMatch: '+(endMatch-1));

        fadata = '';

        if (curPage == 1) {
            $("#famatchdata").html("");
        }

		let w = $(window).width();

		let col = 1;

        // responsive wise add grid rows number.
		if( w > 1024)
			col = 3;
		else if( w > 767 && w <= 1024)
			col = 2;
		let rows = (curPage - 1) * 6;

        for (i = startMatch; i < endMatch; i++) {
            cardCount++;
            rows++
            let rowCount = Math.ceil(rows / col);

           	matched[i] = matched[i].replace("-ms-grid-row:1", "-ms-grid-row:"+rowCount);
            matched[i] = matched[i].replace("facard-count", "facard-"+cardCount);

            fadata += matched[i];
        }

        if (fadata) {
            $("#famatchdata").append(fadata);

            if (matched.length > curPage * perPage) {
                $("#faloadmore").show();
                $("#fadisclosure2").show();
            } else {
                $("#faloadmore").hide();
                $("#fadisclosure1").show();
                $("#fadisclosure2").show();
                $("#fadisclosurelink").attr("href", "https://advisor.morganstanley.com/search?q="+$('#zipcode').val());
            }
        } else {
            $("#famatchdata").html(notFound);
            $("#faloadmore").hide();
            $("#fadisclosure1").show();
            $("#fadisclosure2").show();
            $("#fadisclosurelink").attr("href", "https://advisor.morganstanley.com/search?q="+$('#zipcode').val());
        }

        curPage++;
    }

    /**
     * Finds out the ancestor of the current element based on the class name
     * @param {*Current element} el 
     * @param {*Ancestor className} cls 
     */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

    $('#faloadmorelink').click(showPage);
    $('#famatch').click(function () {
        var zipInRadius = [];
        var zipcode = $(".branch-locator-form .input-wrapper input").val(),
            faMatchbookEl = findAncestor(this, "famatchbook-module");

        var specialty = parseInt($('#specialty').val()) || 0;
        //var zipcodeAPI = aem_context+"/content/dam/msdotcom/appdata/fa-zipcodes";
        var zipcodeAPI = "https://api.promaptools.com/service/us/zips-inside-radius/get/?radius="+zipRadiusKM+"&zip="+zipcode+"&key=r1e382cwgrzi2yg3";
        matched = [];
        curPage = 1;

        //$("#famatch").attr("data-analytics-button", "fa-matchbook-go-" + $("#specialty option:selected").text() + "-" + zipcode);

        if(!zipcode || zipcode.match(/^\d+$/) === null || zipcode.length != 5) {
            $('.input-wrapper .famatchbook').addClass('error');
            $('.famatchbook-error-message').css({'display': 'block'});
            return false;
        } else {
            $('.input-wrapper .famatchbook').removeClass('error');
            $('.famatchbook-error-message').css({'display': 'none'});
        }

        $("#famatchdata").html(loadingImg);
        $("#faloadmore").hide();
        $("#fadisclosure1").hide();
        $("#fadisclosure2").hide();

        $.getJSON(zipcodeAPI, function(data){
            if (data.status == 1) {
                $.each(data.output, function(index, d){
                    zipInRadius.push(d.zip);
                });

                $.getJSON(fadataJSON, function(data){
                    $.each(data, function(index, d){
                        
                        if ((!specialty || jQuery.inArray(specialty, d.d) >= 0) && isSubset(languages, d.e) && (jQuery.inArray(d.j, zipInRadius) >= 0 || d.j == zipcode)) {
                            var match;


                            match = '<div class="facard facard-count" style="-ms-grid-row:1">' +
                                '<h3>' + d.a + '</h3>' +
                                '<div>' + d.b + '</div>' +
                                '<div>' + d.h + ', ' + d.i + '</div>' +
                                '<div class="facontact">' +
                                ((d.c)?(d.c):'') + '<br>' +
                                ((d.g)?'<a href="' + d.g + '" data-analytics-link="NA | FA Matchbook | ' + d.a + ' | View Website" data-analytics-button-cta="NA | FA Matchbook | ' + d.a + ' | View Website" target="_blank">View Website</a>':'') + '<br>' +
                                '</div>' +
                                '</div>' + "\n";
                            matched.push(match);
                        }
                    });

                    shuffle(matched);
                    showPage();
                }).fail(function(jqXHR, status, error){
                    console.log(
                        //'jqXHR: ' + jqXHR.status + "\n" +
                        'jqXHR.status: ' + jqXHR.status + "\n" +
                        'status: ' + status + "\n" +
                        'error: ' + error
                    );
                });
            } else {
                $("#famatchdata").html(notFound);
                console.log('error fetch zip codes: '+data.msg);
            }
        }).fail(function(jqXHR, status, error){
            console.log(
                //'jqXHR: ' + jqXHR.responseText + "\n" +
                'jqXHR.status: ' + jqXHR.status + "\n" +
                'status: ' + status + "\n" +
                'error: ' + error
            );
        });
    });
    var showLabel = "showlabel";
    $('.branch-locator-form .input-wrapper input').on('checkval', function () {
        var labelText = $(this).next('label');
        if(this.value !== '') {
            labelText.addClass(showLabel);
        } else {
            labelText.removeClass(showLabel);
        }
    }).on('keyup', function (e) {
        if($(this).val().length > 0 && $("*[class^='famatchbook']").hasClass("error") && e.which !== 13) {
            $("*[class^='famatchbook']").removeClass("error");
            $(this).attr("aria-invalid", "false");
        }
        $(this).trigger('checkval');
    });
});
(function ($, $document) {

    "use strict";

    var DROPDOWN_SELECTOR = ".branch-locator-form select";

    $document.ready(function () {
        var $dropDown = $(DROPDOWN_SELECTOR);
        if(!$dropDown) return;
        $dropDown.on("change", function (e) {
            var dropDownVal = e.target.value, $target, dropDownText;
            $target = $(e.target);
            if(dropDownVal === "") {
                dropDownText = $target.find("option").filter("[value='']").text();
                setAnalyticsAttributes("data-analytics-dropdown", $target, dropDownText);
                setAnalyticsAttributes("data-analytics-link", $target, dropDownText);
            } else {
                dropDownText = $target.find("option").filter("[value='" + dropDownVal + "']").text();
                if(!dropDownText) return;
                setAnalyticsAttributes("data-analytics-dropdown", $target, dropDownText);
                setAnalyticsAttributes("data-analytics-link", $target, dropDownText);
            }
        });
    });

    function setAnalyticsAttributes(analyticsAttr, $target, dynamicValue) {
        var analyticsVal = $target.attr(analyticsAttr);
        if(analyticsVal) {
        	var analyticsVal = analyticsVal.substring(0, analyticsVal.lastIndexOf("|") + 2) + dynamicValue;
                $target.attr(analyticsAttr, analyticsVal);
        }
    }
})(jQuery, jQuery(document));
/*
 * Fetch Opportunity - Endless Grid data
 */
(function ($, $document) {
    "use strict";

    var ENDLESS_GRID_SELECTOR = ".cmp-opportunity-endlessgrid",
        JSON_PATH_IDENTIFIER = "json-source",
        API_PATH = window.location.origin+"/web/career_services/webapp/service/careerservice/endlessgrid.json",
        LIMIT = "limit",
        OPPORTUNITY = "opportunity";


    $(document).ready(function () {
        var opportunityEndlessGrid = $(ENDLESS_GRID_SELECTOR), jsonPath, limit, opportunityType;
        if(!opportunityEndlessGrid) return;
        $.each(opportunityEndlessGrid, function(index, endlessGrid) {
			limit = $(endlessGrid).data(LIMIT);
            opportunityType = $(endlessGrid).data(OPPORTUNITY);
        	var endlessGridData = fetchGridData();
            if(endlessGridData !== undefined && endlessGridData.resultSet) createDynamicCards(endlessGridData.resultSet, endlessGrid, limit, opportunityType);
        });
    });

    function createDynamicCards(opportunities, endlessGrid, limit, opportunityType) {
        let opportunityTypes = opportunityType.split(",");
        limit = Math.floor(limit / opportunityTypes.length);
		for (let i=0; i<opportunityTypes.length; i++) {
            if (!opportunities[opportunityTypes[i]]) break;
            for (let rowCount=1; rowCount<=limit; rowCount++) {                
                let data = opportunities[opportunityTypes[i]]["row" + rowCount];
                if (data.length > 0) {
                	for (let count=0; count<data.length; count++) {
                        let childDiv = "<div class='jobcard'>"+
                            "<div class='cmp-jobcard'>"+
                                '<a href="' + data[count].url + '" class="cmp-jobcard__link">'+
                                    '<div class="cmp-jobcard__content">'+
                                        '<div class="cmp-jobcard__eyebrow">'+ data[count].opportunity + '</div>'+
                                        '<div class="cmp-jobcard__title">'+ data[count].title +'</div>'+
                                        '<div class="cmp-jobcard__separator purple"></div>'+
                                        '<div class="cmp-jobcard__role">'+ data[count].businessArea +'</div>' +
                                        '<div class="cmp-jobcard__location">'+ data[count].location +'</div>'+
                                    '</div>'+
                                '</a>'+
                            '</div>'+
                        '</div>';
                        $(endlessGrid).append(childDiv);
                	}
                }
        	}
       	}
    }

    function fetchGridData() {
        var gridData;
        $.ajax({
            type: "GET",
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            url: API_PATH,
            async: false,
            contentType: 'text/plain',
            dataType: 'json',
            success: function ( result ) {
                gridData = result;
            },
            failure: function( response ) {
                console.log( "failure: response: " + response );
            }
        });
        return gridData;
    }
})(jQuery, jQuery(document));
(function ($, $document) {
    "use strict";

    var OPPORTUNITY_ENDLESSGRID_SELECTOR = ".opportunity-endlessgrid",
        COMPOSITE_CONTAINER_SECTION_CLASSNAME = "composite-container__section",
        CTA_BTN_SELECTOR = ".button--viewmore-insights",
        TITLE_SELECTOR = ".cmp-title__text",
        TEXT_SELECTOR = ".cmp-text a",
        CARD_LINK_SELECTOR = ".cmp-jobcard__link",
        CARD_TITLE_SELECTOR = ".cmp-jobcard__title",
        CARD_EYEBROW_SELECTOR = ".cmp-jobcard__eyebrow",
        CARD_LOCATION_SELECTOR = ".cmp-jobcard__location",
        CARD_BUSINESS_AREA_SELECTOR = ".cmp-jobcard__role";

    $(document).ready(function () {
        let opportunityGrids = $(OPPORTUNITY_ENDLESSGRID_SELECTOR);
        if (!opportunityGrids || !opportunityGrids.length) return;
        $.each (opportunityGrids, function(index, opportunityEndlessGrid) {
			let $parent = $(findAncestor(opportunityEndlessGrid, COMPOSITE_CONTAINER_SECTION_CLASSNAME)),
            	$ctaBtn = $parent.find(CTA_BTN_SELECTOR),
                $textLinks = $parent.find(TEXT_SELECTOR),
            	$cards = $parent.find(CARD_LINK_SELECTOR);
            if (!$ctaBtn && !textLinks && !$cards) return;
            let title = $parent.find(TITLE_SELECTOR).text().trim() || 'NA';

            if ($ctaBtn) {
				$ctaBtn.attr("data-analytics-link", title + ' | Endless Grid Module | Endless Grid CTA | ' + $ctaBtn.text().trim());
                $ctaBtn.attr("data-analytics-button-cta", title + ' | Endless Grid Module | Endless Grid CTA | ' + $ctaBtn.text().trim());
            }

            $.each ($textLinks, function(index, link) {
                $(link).attr("data-analytics-link", title + ' | Endless Grid Module | Teaser Text | ' + $(link).text().trim());
            });

            $.each ($cards, function(index, card) {
                let cardTitle = $(card).find(CARD_TITLE_SELECTOR).text().trim(),
                    cardEyebrow = $(card).find(CARD_EYEBROW_SELECTOR).text().trim(),
                    cardLocation = $(card).find(CARD_LOCATION_SELECTOR).text().trim(),
                    cardBA = $(card).find(CARD_BUSINESS_AREA_SELECTOR).text().trim(), searchType;

                if (cardEyebrow.toLowerCase() === "experienced professionals" || cardEyebrow.toLowerCase() === "job opening") {
					searchType = "EP";
                } else if (cardEyebrow.toLowerCase() === "students & graduates" || cardEyebrow.toLowerCase() === "students & graduates program") {
					searchType = "S&G";
                }

				$(card).attr("data-analytics-module", "Event Search Card | " + cardTitle + " | position " + (index + 1) + " of " + $cards.length);
                $(card).attr("data-analytics-link", cardEyebrow + " | " + cardTitle + " | NA");
                $(card).attr("data-analytics-event-card", searchType + " | " + cardTitle + " | " + cardLocation + " | " + cardBA + " | NA | NA");
            });
        });
    });

    /**
     * Finds out the ancestor of the current element based on the class name
     * @param {*Current element} el 
     * @param {*Ancestor className} cls 
     */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

})(jQuery, jQuery(document));	

function getmeetTheTeam(db_business_unit,division,business){
  let apiurl= meettheteamAPI + db_business_unit +"|"+ division +"|"+ business;
//let meetheTeamURL = "http://iapp283.devin3.ms.com:4564/auth/bin/location/details.dynadata_locations-results.json/"+regionName+"|"+cityName;


  $.ajax({
      url: apiurl,
      async: false,
      method: "GET",
    contentType:'application/json',
    dataType: "json",
    crossDomain: true,
    xhrFields: {
        withCredentials: true
    },
      success: function(data) {
        if(data && Object.keys(data).length === 0 && data.constructor === Object) {
          $( ".meetthe-team" ).closest( ".container" ).css( "display", "none" );
        }else {
          renderMeetTheTeam(data);
        }
      },
      error: function(data) {
        console.log("error meet the team==",data);
      }
});
}

function renderMeetTheTeam(data) {

  let keys = Object.keys(data);
  let html_to_append = '';
  let count= 0;
  let position = 1;
  let personName;
  for(let key in data) {
      count++;
      personName = data[key].firstName + (data[key].lastName ? (' ' +data[key].lastName) : '');
          html_to_append += '<div class="personcard aem-GridColumn aem-GridColumn--default--none aem-GridColumn--offset--default--0 aem-GridColumn--default--1">'
          +'<div data-gridclasses="aem-GridColumn aem-GridColumn--default--none aem-GridColumn--offset--default--0 aem-GridColumn--default--3"'
          +'class="cmp-personcard r4card card-position-1">'
          +'<a class="cmp-personcard__link" target="_blank" href="'+data[key].url+'"'
          +'data-analytics-link="'+$('.meet_the_team_title').text().trim()+' | '+keys.length+'-Card Module'+' | '+personName+'"'
          +'data-analytics-module="'+'Person Card | '+personName+' | '+'Position '+ position +' of '+keys.length+'">'
          +'<div class="cmp-personcard__image">'
          +'<picture>'
          +'<source media="(max-width: 767px)"'
          +' srcset="'+meettheteamImagePoint+data[key].fileReference+'/_jcr_content/renditions/square_1x1.jpg">'
          +'<source media="(max-width: 1024px)"'
          +'   srcset="'+meettheteamImagePoint+data[key].fileReference+'/_jcr_content/renditions/wide_16x9.jpg">'
          +' <source media="(max-width: 1440px)"'
          +' srcset="'+meettheteamImagePoint+data[key].fileReference+'/_jcr_content/renditions/wide_16x9.jpg">'
          +' <img src="'+meettheteamImagePoint+data[key].fileReference+'/_jcr_content/renditions/wide_16x9.jpg"'
          +' class="cmp-image__image" data-cmp-hook-image="image" alt="card-image">'
          +'</picture>'
          +'</div>'
          +'<div class="cmp-personcard__content card_content">'
          +'<div class="cmp-personcard__eyebrow">Our People</div>'   
          +'<span class="cmp-personcard__title card_title">'+data[key].firstName+' '+data[key].lastName+'</span>'
          +'<div class="cmp-personcard__attribution">'+data[key].jobTitle+'</div>'
          +'</div>'
          +'</a>'
          +'</div>'
          +'</div>';
      position++;
  }
  
          $(".meet-the-team-content").after('<div class="meettheteam_Cards"></div>' )
    
 
      $(".meettheteam_Cards").html(html_to_append);
      $(".meettheteam_Cards").addClass("card_count_"+count);


 }
$(document).ready(function () {
	$('.msdotcom-leadgen-form input[name="others"]').parent().parent().hide();
	
	$('.msdotcom-leadgen-form select[name="I am a"]').change(function(){
		
		if($('.msdotcom-leadgen-form select[name="I am a"]').val() === 'others'){
			$('.msdotcom-leadgen-form input[name="others"]').parent().parent().show();
		}else{
			$('.msdotcom-leadgen-form input[name="others"]').parent().parent().hide();	
		}
			
	});
	
	$('.msdotcom-leadgen-form select[name="states"]').parent().parent().hide();
	
	var flagSelected = 0;
	
	$(".msdotcom-leadgen-form select[name='countries']").change(function() {
		
		$('.msdotcom-leadgen-form select[name="states"]').parent().parent().show();
		
		var selectedCountry = 'all';
		 //$("select[name='countries']").find(":selected").text();
		selectedCountry = $(".msdotcom-leadgen-form select[name='countries']").find(":selected").val();
		
		var n = selectedCountry.lastIndexOf('/');
		var selectedCountryValue = selectedCountry.substring(n + 1);
		
		var path = encodeURI(window.location.pathname.replace(".html", "").replace(/\/$/,''));
		
		var url = path + '.dynadata_country-state-results.json?country='+ selectedCountryValue;               
					$.ajax({
						url: url,
						dataType: 'json',
						success: displayStateListOnLoad,
						error: ajaxFailure
					});
			
		});

		 var displayStateListOnLoad = function(data, flag) {
			 
		var flag = 1;
		var offscreenTextDiv = "<div class='offscreenText' aria-live='polite'>"+data.length+" search results found</div>";
        $(offscreenTextDiv).insertBefore( ".program-tiles" );
        if ((data.length == 0)) {
           $('.msdotcom-leadgen-form select[name="states"]').empty();
              var stateTags = "";
        stateTags += "<label for='selectState'>States</label>";
        stateTags += "<select name='selectState' id='selectState' aria-label='State' data-filter-key='state'>";
        stateTags += "<option value='all' selected='selected'>State</option>";
        stateTags += "</select>";
        populateOptions(stateTags,flagSelected);
        }

        else{ 
            
            stateDropdownOptions(data, flag);
        }
        
        if ((data.length == 0)) {
            $('.program-tiles').empty();
            $('.no-program-results-content').addClass('no-program-results');

        } else {
            console.log("data not coming through")
        }
			 
		 }
		 
		var stateDropdownOptions = function(data, flag,flagSelected) {
        var stateDropdownRow = "";
        var stateTags = "";
        stateTags += "<label for='selectState'>States</label>";
        stateTags += "<select name='selectState' id='selectState' aria-label='City' data-analytics='filter-programs-city' data-filter-key='city'>";
        for (var i = 0; i < data.length; i++) {
            stateTags +=
                "<option value='" + data[i].value + "'>" + data[i].text + "</option>";
        }
        stateTags += "</select>";
        populateOptions(stateTags,flagSelected);

    };
	
	 var populateOptions = function(stateTags,flagSelected) {

        $('.msdotcom-leadgen-form select[name="states"]').html(stateTags);


        if (($('div.insubDivisonPage').length > 0)  && (sessionStorage['divClicked']) && (sessionStorage.getItem('flagSelected')!='1') || (sessionStorage['allSelected']) || (sessionStorage['result']) || (sessionStorage['hasValue']))
        {

            if((sessionStorage.getItem('region')!='all') && (sessionStorage.getItem('city')!='null') && (regionfiltered==0)){
            $(".msdotcom-leadgen-form select[name='selectCity']").val(sessionStorage.getItem('city'));
        }
        }

    };

	var ajaxFailure = function(err) {
        console.log("ajax not defined");
    };		
    
    
    /* Lead Gen Form Validation */

    var floatLabel = 'floatingLabel';
    // Analytics implementation new
    promoBreakerTitle = $(".promo-breaker-lead-gen .cmp-promobreaker__contenttitle").text().trim();
    var findFormElement =   $(".promo-breaker-lead-gen").next().find("form");
    findFormElement.attr("data-analytics-form-type","Lead Generation").attr("data-analytics-form-name",promoBreakerTitle);
	var getCtaButton = findFormElement.find(".cmp-form-button");
    let btnValue = $(getCtaButton[0]).text();
    $(getCtaButton[0]).attr("data-analytics-button-cta","Lead Generation | " + promoBreakerTitle +" | " + btnValue +" " );

    $('.cmp-form input, .cmp-form textarea').on('keyup', function () {
        var labelText = $(this).next('label');
        if (this.value !== '') {
            labelText.addClass(floatLabel);
        } else {
            labelText.removeClass(floatLabel);
        }
    });


    /* LeadGen From First interaction*/
	var formFirstInteraction = false;
    $(".cmp-form").on('input', function (e) {
        if(!formFirstInteraction) {
          console.log("LeadGen :Action Start")
		  _satellite.track("form_interaction", {action: "start", form_type: "Lead Generation",form_name:promoBreakerTitle});
        }

        formFirstInteraction = true;
    });


   /* LeadGen From First interaction - Buttons Click*/

    $(".cmp-form-button").click(function (e) {
        let ctaButtonName = $(this).text();
        if(!formFirstInteraction) {
          console.log("LeadGen :Action Start")
		  _satellite.track("form_interaction", {action: "start", form_type: "Lead Generation",form_name:promoBreakerTitle});
        }
        formFirstInteraction = true;

        leadGenFormValidation(e, ctaButtonName);
    });

/*
    $('.cmp-form input, .cmp-form .cmp-form-text__textarea').on('keyup', function (e) {
        $.each($(".cmp-form .text input"), function (key, val) {
            let inputVal = $.trim($(this).val());
            let inputType = $.trim($(this).attr('type'));
            if (inputVal.length > 2) {
                $(this).addClass("error-remove--border").attr("aria-invalid", "false");
                $(this).next().next().remove();
            }
        });
    });
*/
	/* LeadGen From Field Changes - Input Field*/
     $.each($(".cmp-form .text input, .cmp-form .cmp-form-text__textarea"), function (key, val) {
			let defaultValue = "";
            let currentValue = "";

            $(this).on('focus', function (e) {
                defaultValue = $.trim($(this).val());
        	});
              $(this).on('change', function (e) {
                currentValue = $.trim($(this).val());
       		});        

            $(this).on('focusout', function (e) {
                if(defaultValue != currentValue) {
                    let fieldName = $(this).next().text();                    
                    console.log("LeadGen Form: Field Changes");
                    _satellite.track("form_interaction", {action: "change", form_type: "Lead Generation",form_name:promoBreakerTitle,field_changed:fieldName});
                }
           });

    });


	/* LeadGen From Field Changes - Dropdown Field*/
     $.each($(".cmp-form-options.cmp-form-options--drop-down"), function (key, val) {     
            $(this).on('input', function (e) {
                //setTimeout(function () {
                let fieldName = $(this).find("label").text();                    
                console.log("LeadGen Form: Field Changes");
                _satellite.track("form_interaction", {action: "change", form_type: "Lead Generation",form_name:promoBreakerTitle,field_changed:fieldName});
                //}, 1000);
           });
    });

    /* LeadGen From Field Changes - Checkbox Field*/
     $.each($(".cmp-form-options__field.cmp-form-options__field--checkbox, .cmp-form-options.cmp-form-options--radio"), function (key, val) {     
            $(this).on('input', function (e) {
             //   setTimeout(function () {
                let fieldName = $(this).next().text();                    
                console.log("LeadGen Form: Field Changes");
                _satellite.track("form_interaction", {action: "change", form_type: "Lead Generation",form_name:promoBreakerTitle,field_changed:fieldName});
             //   }, 1000);
           });
    });


/*    
    $('.cmp-form-options__field.cmp-form-options__field--checkbox').change(function () {
        if($(this).prop("checked")) {
            $(this).addClass("error-remove--border").attr("aria-invalid", "false");
            $(this).next().next().remove();
        }
        else if (!$(this).next().next().hasClass("error-message")) {
            $(this).next().after('<span class="error-message" aria-hidden="false"> * Please check the aggrement </span>');
            $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
        }
    });
*/

   $.each($(".cmp-form .text input, .cmp-form .cmp-form-text__textarea"), function (key, val) {
       let isRequired = $(this).prop('required');
       let placeHolderValue = $(this).next().text();
       if(isRequired) {
           $(this).next().text(placeHolderValue + " (required)");
           let labelName = $(this).next().text(placeHolderValue + " (required)").text();
           $(this).attr("aria-label", labelName);
       }
   });

   $.each($(".cmp-form-options.cmp-form-options--drop-down"), function (key, val) {

       let isRequired = $(this).attr('required');
       let placeHolderValue = $(this).find("label").text();
       if(isRequired) {
           $(this).find("label").text(placeHolderValue + " (required)"); 
           let labelName = $(this).find("label").text(placeHolderValue + " (required)").text(); 
           $(this).find("select").attr("aria-label", labelName);
       }
   });


    function leadGenFormValidation(e, ctaButtonName) {
        $.each($(".cmp-form input"), function (key, val) {
            var inputVal = $.trim($(this).val());
            let inputType = $.trim($(this).attr('type'));
            let isrequiered = $(this).prop('required');
            let geterrorMessage = $(this).parent().attr("data-cmp-required-message");


            if (inputType === "email") {
                var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
                var entry_email = $.trim($(this).val());
                var validEmail = emailReg.test(entry_email);

                if (!validEmail) {
                    let identifierName = $(this).attr("aria-describedby");
                    if (geterrorMessage && !$(this).next().next().hasClass("error-message")) {
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> ' + geterrorMessage + '</span>');;
                        $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                        e.preventDefault();
                    } else if (!$(this).next().next().hasClass("error-message")) {
                        let fieldName = $(this).next().text().replace("(required)","");
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> Please enter a valid email address.');
                        $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    }
                    $(this).addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                } else {
                    $(this).addClass("error-remove--border").attr("aria-invalid", "false");
                    $(this).next().next().remove();
                }
            }

            if (inputType === "text" && isrequiered) {

                let geterrorMessage = $(this).parent().attr("data-cmp-required-message");
                if (inputVal.length < 3) {
                    let identifierName = $(this).attr("aria-describedby");
                     if(geterrorMessage && !$(this).next().next().hasClass("error-message")) {
                         $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> ' + geterrorMessage + '</span>');
                         $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");

                    } else if (!$(this).next().next().hasClass("error-message")) {
                        let fieldName = $(this).next().text().replace("(required)","");
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> Please enter valid ' + fieldName + '</span>');
                        $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    }
                    $(this).addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                } else {
                    $(this).addClass("error-remove--border").attr("aria-invalid", "false");
                    $(this).next().next().remove();
                }
            }

            if (inputType === "tel") { 

                inputVal = inputVal.replace(/[^0-9]/g, '');

                var phoneNumberReg = new RegExp(/^[\+]?([0-9][\s]?|[0-9]?)([(][0-9]{3}[)][\s]?|[0-9]{3}[-\s\.]?)[0-9]{3}[-\s\.]?[0-9]{4,6}$/im);
                var entryPhone = $.trim($(this).val());
                var validPhone = phoneNumberReg.test(entryPhone);
                let geterrorMessage = $(this).parent().attr("data-cmp-required-message");
                let identifierName = $(this).attr("aria-describedby");

                if (!validPhone) {
                    if (geterrorMessage && !$(this).next().next().hasClass("error-message")) {
                        let fieldName = $(this).next().text();
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> ' + geterrorMessage + '</span>');
                        $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    }
                    else if (!$(this).next().next().hasClass("error-message")) {
                        let fieldName = $(this).next().text();
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> Please enter a valid ' + fieldName + ' For example: 123-456-7890.'+'</span>');
                        $(this).addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                        e.preventDefault();
                         return false;
                    }
                    $(this).addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                } else {
                    $(this).addClass("error-remove--border").attr("aria-invalid", "false");
                    $(this).next().next().remove();
                }

            }
        });



        $.each($(".cmp-form-options.cmp-form-options--radio"), function (key, val) {
            let radioButtonRequired = $(this).attr('required');
            let geterrorMessage = $(this).attr("data-cmp-required-message");
            if (radioButtonRequired) {
                let atLeastOneChecked = false;
                $("input[type=radio]").each(function () {
                    if ($(this).prop('checked')) {
                        atLeastOneChecked = true;
                    }
                });

                if (!atLeastOneChecked) {
                    let identifierName = $(this).find('input[type="radio"]').attr("aria-describedby");
                    if(geterrorMessage && !$(this).next().hasClass("error-message")) {
                         $(this).after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> ' + geterrorMessage + '</span>');
                         $(this).find('input[type="radio"]').addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");

                    } else if (!$(this).next().hasClass("error-message")) {
                        $(this).after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> Please choose one option </span>');
                        $(this).find('input[type="radio"]').addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                        e.preventDefault();
                        $($(".error-message")[0]).prev().prev().focus();
                        return false;
                    }
                    else {
                        e.preventDefault();
                        $($(".error-message")[0]).prev().prev().focus();
                        return false;
                    }
                    $(this).find('input[type="radio"]').addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                } else {
                    $(this).next().remove();
					$(this).find('input[type="radio"]').css("border", "3px solid #FFFFFF").css("outline", "0").attr("aria-required", "true").attr("aria-invalid", "true");
                }
            }

        });


        $.each($(".cmp-form-options.cmp-form-options--drop-down"), function (key, val) {
            let selectBoxRequired = $(this).attr('required');
            let geterrorMessage = $(this).attr("data-cmp-required-message");

            if (selectBoxRequired) {
                let selectedDropDownValue = $(this).find(".cmp-form-options__field.cmp-form-options__field--drop-down").children("option:selected").val();
                let identifierName = $(this).find("select").attr("aria-describedby");
                if (selectedDropDownValue === "select") {
                    if(geterrorMessage && !$(this).next().hasClass("error-message")) {
                        $(this).after('<span class="error-message" aria-hidden="false" id="'+identifierName+'">' + geterrorMessage + '</span>');
                        $(this).find("select").addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");

                    } else if (!$(this).next().hasClass("error-message")) {
                        $(this).after('<span class="error-message" aria-hidden="false" aria-hidden="false" id="'+identifierName+'"> Please select any one option </span>');
                        $(this).find("select").addClass("error-message--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    }
                    else{
                     //   e.preventDefault();
                     $($(".error-message")[0]).prev().prev().focus();
                     //   return false;
                	}
                    $(this).find("select").addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                }
                else {
                    $(this).find("select").addClass("error-remove--border").attr("aria-invalid", "false");
                    $(this).find("select").removeAttr("style");
                    $(this).next().remove();
                }
            }

        });

        $.each($(".cmp-form-text textarea"), function (key, val) {

            let textAreaRequired = $(this).attr('required');
            let geterrorMessage = $(this).parent().attr("data-cmp-required-message");

            if (textAreaRequired) {
                let textAreaValue = $(this).val();
                if (textAreaValue.length < 3) {
                    let identifierName = $(this).attr("aria-describedby");
                    if (geterrorMessage && !$(this).next().next().hasClass("error-message")) {
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'">  ' + geterrorMessage + '</span>');
                        $(this).find("textarea").addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");

                    } else if (!$(this).next().next().hasClass("error-message")) {
                        $(this).next().after('<span class="error-message" aria-hidden="false" id="'+identifierName+'">  Please enter message </span>');
                        $(this).addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    }
                    else {
                        e.preventDefault();
                        $($(".error-message")[0]).prev().prev().focus();
                        return false;
                    }
                }
                else {
                    $(this).addClass("error-remove--border").attr("aria-invalid", "false");
                    $(this).next().next().remove();
                }
            }

        });


        $.each($(".cmp-form-options.cmp-form-options--checkbox"), function (key, val) {
            let checkBoxRequired = $(this).attr('required');
            let geterrorMessage = $(this).attr("data-cmp-required-message");
            if (checkBoxRequired) {
                let atLeastOneChecked = false;
                $("input[type=checkbox]").each(function () {
                    if ($(this).prop('checked')) {
                        atLeastOneChecked = true;
                    }
                });

                if (!atLeastOneChecked) {
                    let identifierName = $(this).find('input[type="checkbox"]').attr("aria-describedby");
                    if(geterrorMessage && !$(this).next().hasClass("error-message")) {
                         $(this).after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> ' + geterrorMessage + '</span>');
                         $(this).find('input[type="checkbox"]').addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");

                    } else if (!$(this).next().hasClass("error-message")) {
                        $(this).after('<span class="error-message" aria-hidden="false" id="'+identifierName+'"> Please choose one option </span>');
                        $(this).find('input[type="checkbox"]').addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                        e.preventDefault();
                        $($(".error-message")[0]).prev().prev().focus();
                        return false;
                    }
                    else {
                        e.preventDefault();
                        $($(".error-message")[0]).prev().prev().focus();
                        return false;
                	}
                    $(this).find('input[type="checkbox"]').addClass("error-message--border").removeClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                }
                else if($(".error-message").length > 0 ) {
                    $($(".error-message")[0]).prev().prev().focus();
                    $(this).next().remove();
                    $(this).find('input[type="checkbox"]').addClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                    e.preventDefault();
                    return false;
                }
                else {
					$(this).next().remove();
                    $(this).find('input[type="checkbox"]').addClass("error-remove--border").attr("aria-required", "true").attr("aria-invalid", "true");
                }
            }

        });

        /* LeadGen From Submit - Starts */
        if(ctaButtonName == "Submit") {
            if($(".cmp-form").find(".error-message").length != 0) {
                console.log("LeadGen: Submit Error");
                _satellite.track("form_interaction", {action: "submit_error", form_type: "Lead Generation",form_name:promoBreakerTitle});
                $($(".error-message")[0]).prev().prev().focus();
                let getErrorEleId = $($(".cmp-form").find(".error-message")[0]).attr("id");
                $("#"+getErrorEleId).prev().find("select").focus().css("border", "3px solid #d7222d");
             }
               else {
                console.log("LeadGen: Submit Sucess");
                   _satellite.track("form_interaction", {action: "submit_success", form_type: "Lead Generation",form_name:promoBreakerTitle});
               }
        }
    	/* LeadGen From First Submit - Ends */       

    }

    setTimeout(function () {
        $.each($(".cmp-form .text input, .cmp-form .cmp-form-text__textarea"), function (key, val) {
            var textLength = $(this).val().length;
            if (textLength > 0) {
                $(this).next('label').addClass("floatingLabel");
            }
        });
    }, 1000);


    /* Dyanamically update LeadGen Form margin top */
    let getPBDescHeight = $(".cmp-promobreaker__contentdescription").height();
    if(getPBDescHeight < 200) {
        let leadGenFromTop = getPBDescHeight - 200 + "px";
        $(".msdotcom-leadgen-form .cmp-form").css("margin-top",leadGenFromTop);
    }
    else {
        $(".msdotcom-leadgen-form .cmp-form").css("margin-top","0px");   
    }

});
var ACCORDION_WRAPPER_CLASS = "acc-wrap",
    FILTER_LABEL_CLASS = "filter-label",
    EVENT_LOCATION_FILTER_CLASS = "accordion--location__filters",
    EVENT_FILTER_DONE_BTN_SELECTOR = ".cmp-events--filter--resultset .filter-done a",
    EVENT_RESULTSET_CLASS = 'cmp-events--filter--resultset',
    enteredKeyword; 
$(document).ready(function () {

    var checkboxes = document.querySelectorAll(".cmp-events--filter--resultset .checkbox input");

    for(let count=0; count<checkboxes.length; count++) {
        checkboxes[count].addEventListener('change', function (event) {
            let parentWrapper = findAncestor(event.target, ACCORDION_WRAPPER_CLASS),
                filterLabel = parentWrapper.querySelector("." + FILTER_LABEL_CLASS).textContent.trim(),
                filterDoneBtn = findAncestor(parentWrapper, EVENT_RESULTSET_CLASS).querySelector(EVENT_FILTER_DONE_BTN_SELECTOR),
				flowType = experienceHire ? "Experienced Professionals" : "S&G";
                filterLabel = filterLabel.indexOf("(") !== -1 ? filterLabel.slice(0, filterLabel.indexOf("(")).trim() : filterLabel;
            if (filterDoneBtn)  {
            	filterDoneBtn.setAttribute("data-analytics-link", "Events Search Filter | " + flowType + " | " + filterLabel + " | Done");
                filterDoneBtn.setAttribute("data-analytics-button", "Events Search Filter | " + flowType + " | " + filterLabel + " | Done");
            }
        });
    }

    // $('.cmp-events--filter__accordion .accordion--header').on('keyup', function(e){
    //     if(e.keyCode === 13) {
    //         $(this).click(); 
    //     }
    // });
     function getUrlParameter(name) {
         name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
         var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
         var results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
     };
    
    var getJobQuery = getUrlParameter('opportunity');
    var getEventsBusinessArea = getUrlParameter('businessarea');
    var getProgramType = getUrlParameter('programtype');  
    var getEducationLevel = getUrlParameter('educationlevel');
    var getRegion = getUrlParameter('region');
    var getCountry = getUrlParameter('country');
    var getState = getUrlParameter('state');
    var getCity = getUrlParameter('city');
    opportunityValue = getJobQuery.toLowerCase();
  
    var loacationRegionValue = getRegion.split(',');
    var loacationCountryValue = getCountry.split(',');
    var loacationStateValue = getState.split(',');
    var loacationCityValue = getCity.split(',');
    let queryParamaters = {
        region: loacationRegionValue,
        country: loacationCountryValue,
        state: loacationStateValue,
        city: loacationCityValue
    };
    
    experienceHire = true;
    epBackButtonFlag = true;
    sgBackButtonFlag = true;


    var eventsQueryParamsValue = {
        'institutional-securities-group': 'Institutional Securities Group',
        'operations': 'Operations',
        'company': 'Company',
        'investment-management': 'Investment Management',
        'wealth-management': 'Wealth Management',
        'technology': 'Technology'
    };

    var getEventsBAQueryParam = getEventsBusinessArea.split(';');
    getEventsBusinessArea = "";

    for (i = 0; i < getEventsBAQueryParam.length; i++) {
        let convertValue = getEventsBAQueryParam[i];
        getEventsBusinessArea += eventsQueryParamsValue[convertValue] + ';';
    }


    if(getEventsBusinessArea !== "undefined;") {
    	collectedParameterValues = "?category=sg&businessArea="+getEventsBusinessArea+"&lang=en";
    }
    else {
		collectedParameterValues = "?category=sg&lang=en";
    }

    createRequestEventsResultSet(collectedParameterValues);

        $(".clearSelection").on('keydown',function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode == 13 || event.keyCode == 27) {
                $(this).click().blur();
            }
        });

 
        $(".career-type-division li").click(function(){
            $(".career-type-division-level-1").show(); 
            let getItemIndex = $(this).index();
            $(this).parent().siblings(".career-type-division-level-1").children("ul").hide();
            $($(this).parent().siblings(".career-type-division-level-1").children("ul")[getItemIndex]).show();
            $('.career-type-division li').css("opacity","1");
            $(this).siblings().css("opacity","0.5");
        })
    

   
        $('.cmp-events--filter--resultset .resultsSort').click(function(e) { 
            e.preventDefault();
            if($(this).find('span').hasClass('sort-down')) {
                $(this).find('a').attr('aria-label','descending order by date')
            }else {
                $(this).find('a').attr('aria-label','ascending order by date')
            }
            $(this).find('span').toggleClass('sort-down');
            eventResultSet.eventResults.reverse();
              generateEventsResult(eventResultSet,currentPage, enteredKeyword, "noautoselect");
        });
        
        eventsAccordionCheckBox();

    });





        function eventsDoneClick() {
            $(".events .filter--button--done").on('click', function (e) { 
                
                e.preventDefault();
                $(".accordion--header .accordion--arrow").removeClass("expand");
                $(".accordion--header").each(function(index) {
                    let analyticsVal = $(this).attr("data-analytics-link");
                    analyticsVal = analyticsVal.replace("Collapse", "Expand");
                    $(this).attr("data-analytics-link", analyticsVal);
                });
                $(".accordion--filter--title").hide();
                $('.accordion--content').hide();
                $(".cmp-events--filter--resultset").removeClass("active");
                $(".cmp-events--filter--resultset.events .cmp-events--result__set").addClass("cmp-events--result__set--expand");
                
                let getLangSelection = $($(".events .accordion--jobslevel__filters li").find("input:checked")).val();
                if(getLangSelection === "FR") {
                    $(".events .accordion--jobslevel__label").text("Événements disponibles en: Francais");
                }
                else {
                    $(".events .accordion--jobslevel__label").text("Events available in: English");
                }


                var getQueryParams = getSelectedValuesEvents();
				createRequestEventsResultSet(getQueryParams);
                switchFloatingMenu();
                
            });    
        }


        function switchFloatingMenu() {
            if(window.innerWidth <= 1024) {
                $(".cmp-events--filter__accordion").hide();
                //$(".cmp-events--result__set").toggle();
                //$(".resultsFound").toggle();
                //$(".resultsSort").toggle();
                $(".floatingMenu").toggleClass("topMenu");
            }
        }

       function clearAllFilterEvents(element) {
        idSelector = "events";
            let resultSetParent = document.querySelector(".cmp-events--filter--resultset"),            
            filterParent = resultSetParent.querySelector("." + EVENT_LOCATION_FILTER_CLASS);
            if (getActualLocationSelections(filterParent).length > 0) {
                if (window.innerWidth > 767) {
                    clearAllSelections(filterParent);  
                    initLocationSet();                  
                } else clearAllMobileSelections(filterParent);
                filterParent.querySelector(".clearSelection").classList.add("disabled");
            }          
            updateLocationCount(filterParent); 

            collectedParameterValues = '?category=sg&lang=en';
            experienceHire = true;
			createRequestEventsResultSet(collectedParameterValues);

            $(".cmp-events--filter--resultset.studentsandgrads").hide();
            $(".cmp-events--filter--resultset.experienceHire").css("display","-ms-grid").css("display","grid");
            $(".accordion--filterby__clear").click();
            $(".cmp-events--filter--resultset").removeClass("active");
            $(".cmp-events--result__set").addClass("cmp-events--result__set--expand");
            $(".accordion--header .accordion--arrow").removeClass("expand");
 			$('.accordion--content').hide();
           	$(".accordion--jobslevel__label").text("Events available in: English");
			$(".accordion--jobslevel__filters .checkbox input#English").prop('checked', true);
			$(".accordion--jobslevel__filters .checkbox input#English-sg").prop('checked', true);

         }

     function eventsAccordionCheckBox() {
        $('.cmp-events--filter__accordion .accordion--header').on('keyup', function(e){
            if(e.keyCode === 13) {
                $(this).click(); 
            }
        });

    //Accordion click    
        $('.cmp-events--filter__accordion .accordion--header').off('click').on('click', function (e) {
            $(".cmp-events--filter--resultset").removeClass("active");
            $(".accordion--filter--title, .description_section").hide();
           $(".cmp-events-aggregate .jobcard_arrow").removeClass("up").addClass("down");
           

            if($(this).next().is(":visible")){
                $(this).next().hide();
                $(this).find(".accordion--arrow").removeClass("expand");
                let analyticsVal = $(this).attr("data-analytics-link");
                analyticsVal = analyticsVal.replace("Collapse", "Expand");
                $(this).attr("data-analytics-link", analyticsVal);
                $(".cmp-events--result__set").addClass("cmp-events--result__set--expand");
                return;
            }
            
            if ($(this).next().next().is(":visible")) {
                $(this).next().hide();
                $(this).next().next().hide();
                $(this).find(".accordion--arrow").removeClass("expand");
                let analyticsVal = $(this).attr("data-analytics-link");
                analyticsVal = analyticsVal.replace("Collapse", "Expand");
                $(this).attr("data-analytics-link", analyticsVal);
                $(".cmp-events--result__set").addClass("cmp-events--result__set--expand");
                return;
            }
            
            $('.accordion--content').hide();
            $(this).next().next().show();
            
            if($(this).next().next().length == 0){
                $(this).next().show();
            }
            $('.cmp-events--filter__slick .accordion--arrow').removeClass("expand");

            $(this).find(".accordion--arrow").addClass("expand");
            let analyticsVal = $(this).attr("data-analytics-link");
            analyticsVal = analyticsVal.replace("Expand", "Collapse");
            $(this).attr("data-analytics-link", analyticsVal);
            $(".cmp-events--filter--resultset").addClass("active")
            $(".cmp-events--result__set").removeClass("cmp-events--result__set--expand");
        
        });    

    //Checkbox Validation
        $(".accordion--businessarea__wrapper .level_1 input").change(function () {
            var hasChild = $(this).parents(".has-child");
            if (this.checked == false) {
                $(this).parents(".level_1").siblings(".checkbox").find("input")[0].checked = false;
            }
            if ($(hasChild).find(".level_1 input:checked").length == $(hasChild).find(".level_1 input").length) {
                $(this).parents(".level_1").siblings(".checkbox").find("input")[0].checked = true;
            }
            if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
                $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
				$(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
                $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');
            }
            let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
            if( getSelectedLength > 0){
                $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" +getSelectedLength +" Selected)");
            }
            else{
                $(".accordion--businessarea__wrapper .selected--checkbox").hide();
            }
        });
    
        $(".accordion--businessarea__wrapper .no-child input").change(function () {
    
            if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
                $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
                $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');
            }
            let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
            if( getSelectedLength > 0){
                $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" +getSelectedLength +" Selected)");
            }
            else{
                $(".accordion--businessarea__wrapper .selected--checkbox").hide();
            }
        });
        
        $(".accordion--businessarea__wrapper .has-child >div.checkbox input").change(function () {
            var status = this.checked;
            var childNodes = $(this).parents(".has-child").find(".level_1 input");
            $(childNodes).each(function () {
                this.checked = status
            });
            if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
                $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
                $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');
        
            }
    
            let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
            if( getSelectedLength > 0){
                $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" +getSelectedLength +" Selected)");
            }
            else{
                $(".accordion--businessarea__wrapper .selected--checkbox").hide();
            }
        });
        $(".accordion--businessarea__wrapper .clearSelection").on('keyup', function(e){
            if(e.keyCode===13) {
                $(this).click();
            }
        });
        $(".accordion--businessarea__wrapper .clearSelection").click(function () {
            $('.accordion--businessarea__wrapper input[type=checkbox]').prop('checked', false);
            $(this).addClass("disabled");
            $(this).attr("tabindex","-1");
            $(".accordion--businessarea__wrapper .selected--checkbox").hide();
    
        });

         $(".accordion--format__wrapper div.checkbox input").change(function () {
    
            if ($(".accordion--format__wrapper input:checked").length > 0) {
                $(".accordion--format__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--format__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--format__wrapper .clearSelection").addClass("disabled");
                $(".accordion--format__wrapper .clearSelection").attr('tabindex', '-1');
            }
            let getFormatSelectedLength = $('.accordion--format__wrapper input[type=checkbox]:checked').length;
            if( getFormatSelectedLength > 0){
                $(".accordion--format__wrapper .selected--checkbox").show().text(" (" +getFormatSelectedLength +" Selected)");
            }
            else{
                $(".accordion--format__wrapper .selected--checkbox").hide();
            }
         });
    
         $(".accordion--format__wrapper  .clearSelection").on('keyup', function(e){
            if(e.keyCode===13) {
                $(this).click();
            }
        });
        $(".accordion--format__wrapper .clearSelection").click(function () {
            $('.accordion--format__wrapper input[type=checkbox]').prop('checked', false);
            $(this).addClass("disabled");
            $(this).attr("tabindex","-1");
            $(".accordion--format__wrapper .selected--checkbox").hide();
    
        });

        $(".accordion--audience__wrapper div.checkbox input").change(function () {
    
            if ($(".accordion--audience__wrapper input:checked").length > 0) {
                $(".accordion--audience__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--audience__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--audience__wrapper .clearSelection").addClass("disabled");
                $(".accordion--audience__wrapper .clearSelection").attr('tabindex', '-1');
        
            }
    
            let getAudienceSelectedLength = $('.accordion--audience__wrapper input[type=checkbox]:checked').length;
            if( getAudienceSelectedLength > 0){
                $(".accordion--audience__wrapper .selected--checkbox").show().text(" (" +getAudienceSelectedLength +" Selected)");
            }
            else{
                $(".accordion--audience__wrapper .selected--checkbox").hide();
            }
         });
    
         $(".accordion--audience__wrapper  .clearSelection").on('keyup', function(e){
            if(e.keyCode===13) {
                $(this).click();
            }
        });
        $(".accordion--audience__wrapper .clearSelection").click(function () {
            $('.accordion--audience__wrapper input[type=checkbox]').prop('checked', false);
            $(this).addClass("disabled");
             $(this).attr("tabindex","-1");
            $(".accordion--audience__wrapper .selected--checkbox").hide();
    
        });
    
         $(".accordion--programtype__wrapper div.checkbox input").change(function () {
    
            if ($(".accordion--programtype__wrapper input:checked").length > 0) {
                $(".accordion--programtype__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--programtype__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--programtype__wrapper .clearSelection").addClass("disabled");
                $(".accordion--programtype__wrapper .clearSelection").attr('tabindex', '-1');
        
            }
    
            let getProgramSelectedLength = $('.accordion--programtype__wrapper input[type=checkbox]:checked').length;
            if( getProgramSelectedLength > 0){
                $(".accordion--programtype__wrapper .selected--checkbox").show().text(" (" +getProgramSelectedLength +" Selected)");
            }
            else{
                $(".accordion--programtype__wrapper .selected--checkbox").hide();
            }
         });
    
         $(".accordion--programtype__wrapper  .clearSelection").on('keyup', function(e){
            if(e.keyCode===13) {
                $(this).click();
            }
        });
        $(".accordion--programtype__wrapper .clearSelection").click(function () {
            $('.accordion--programtype__wrapper input[type=checkbox]').prop('checked', false);
            $(this).addClass("disabled");
            $(this).attr("tabindex","-1");
            $(".accordion--programtype__wrapper .selected--checkbox").hide();
    
        });
    
         $(".accordion--educationlevel__wrapper div.checkbox input").change(function () {
    
            if ($(".accordion--educationlevel__wrapper input:checked").length > 0) {
                $(".accordion--educationlevel__wrapper .clearSelection").removeClass("disabled");
                $(".accordion--educationlevel__wrapper .clearSelection").attr('tabindex', '0');
            } else {
                $(".accordion--educationlevel__wrapper .clearSelection").addClass("disabled");
                $(".accordion--educationlevel__wrapper .clearSelection").attr('tabindex', '-1');

            }
    
            let getEducatonSelectedLength = $('.accordion--educationlevel__wrapper input[type=checkbox]:checked').length;
            if( getEducatonSelectedLength > 0){
                $(".accordion--educationlevel__wrapper .selected--checkbox").show().text(" (" +getEducatonSelectedLength +" Selected)");
            }
            else{
                $(".accordion--educationlevel__wrapper .selected--checkbox").hide();
            }
         });
         $(".accordion--educationlevel__wrapper  .clearSelection").on('keyup', function(e){
            if(e.keyCode===13) {
                $(this).click();
            }
        });
        $(".accordion--educationlevel__wrapper .clearSelection").click(function () {
            $('.accordion--educationlevel__wrapper input[type=checkbox]').prop('checked', false);
            $(this).addClass("disabled");
             $(this).attr("tabindex","-1");
            $(".accordion--educationlevel__wrapper .selected--checkbox").hide();
    
        });
    

    
    // No results Clear all filters
        $(".button--noresults-clearall-events").off().on('click', function (e) { 
            e.preventDefault();
			clearAllFilterEvents();
         });

         $(".cmp-events--filter__accordion .accordion--filterby__clear").on('keyup',function(e){
                if(e.keyCode === 13) {
                    $(this).click();
                }
         })

    // Clear All Filters
         $(".cmp-events--filter__accordion .accordion--filterby__clear").on('click', function (e) { 
             e.preventDefault();
             // Clear locations
             let parent = findAncestor(e.target, EVENT_RESULTSET_CLASS),
                locationFilterSec = parent.querySelector("." + EVENT_LOCATION_FILTER_CLASS);
             if (getActualLocationSelections(locationFilterSec).length > 0) {
                if (window.innerWidth > 767) {
                    clearAllSelections(locationFilterSec);
                    initLocationSet();                    
                } else clearAllMobileSelections(locationFilterSec);
                updateLocationCount(locationFilterSec);
                locationFilterSec.querySelector(".clearSelection").classList.remove("disabled");
             }

             $('.cmp-events--filter__accordion input[type=checkbox]').prop('checked', false);
             $(".accordion--jobslevel__label").text("Events available in: English");
			 $(".accordion--jobslevel__filters .checkbox input#English").prop('checked', true)
			 $(".accordion--jobslevel__filters .checkbox input#English-sg").prop('checked', true)

             $(this).addClass("disabled");
              $(this).attr("tabindex","-1");
             $(".cmp-events--filter__accordion .selected--checkbox").hide();
             $(".clearSelection").addClass("disabled");
             $(".cmp-events--filter--resultset").addClass("active");
             $(".cmp-events--result__set").removeClass("cmp-events--result__set--expand");
         });

         $(".cmp-events--filter__accordion div.checkbox input").change(function () {

            if ($(".cmp-events--filter__accordion input:checked").length > 0) {
                $(".accordion--filterby__clear").removeClass("disabled");
                $(".accordion--filterby__clear").attr("tabindex","0");
            } else {
                $(".accordion--educationlevel__wrapper .clearSelection").addClass("disabled");
                $(".accordion--filterby__clear").addClass("disabled");
                $(".accordion--filterby__clear").attr("tabindex","-1");
            }
            });
       }

    // Create request for result set
    function createRequestEventsResultSet(collectedParameterValues, keyword) {
        var pageUrl = window.location.href;
        if(pageUrl.indexOf('careers/events-aggregate') > -1) {
            var EVENTS_SERVLET_PATH = window.location.origin + "/web/career_services/webapp/service/careerservice/eventdetails.json" + collectedParameterValues;
            // var EVENTS_SERVLET_PATH = "http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/eventdetails.json"+collectedParameterValues;
            eventResultSet = fetchEventsResultSet(EVENTS_SERVLET_PATH);

            if (eventResultSet) {
                generateEventsResult(eventResultSet, currentPage);
            }
            $(".backButton").hide();
        }
    }


    // Populated selected checkbox values
    function getSelectedValuesEvents() {
        var collectedValues = "";
        var childValues = "";
        var parentValues = "";
        var countryValues = "";
        var tempArray = [];
    
    
       collectedValues = '?category=sg';

         var regionQueryString=[];
         $("[data-region-name]").each(function(index,val){
          
           var region = val.getAttribute("data-region-name");
           var hasChild = $(val).find(".location-dropdown");
            if(region && hasChild.length > 0){
         
                 $(hasChild).each(function(index,subLocation) {
 
                  var country = $(subLocation).find("[name='country']") && $(subLocation).find("[name='country']").val().indexOf("select-any") != 0 ?"_"+$(subLocation).find("[name='country']").val():""
                  var state = $(subLocation).find("[name='state']") && $(subLocation).find("[name='state']").val().indexOf("all") != 0 ?"_"+$(subLocation).find("[name='state']").val():""
                  var city = $(subLocation).find("[name='city']") && $(subLocation).find("[name='city']").val().indexOf("all") != 0 ? ":"+$(subLocation).find("[name='city']").val():""
 
                  if(country != "") {
                      if(country == "_all") {
                         country = "";
                      }
                      regionQueryString.push(region+country+state+city);
                  }
 
                 });
             }
            
         })
 
         if(regionQueryString.length > 0)
             collectedValues += "&location="+regionQueryString.join(';');
 
    
        $(".accordion--businessarea__wrapper .has-child > div.checkbox input").each(function () {
            if (this.checked) {
                tempArray.push($(this).val());
                if (tempArray.length !== 0 && parentValues.indexOf("businessArea") > -1) {
                    parentValues += ';' + tempArray.toString();
                    tempArray = [];
                }
                else {
                    parentValues += '&businessArea=' + tempArray.toString();
                    tempArray = [];
                }
            }
            else {
                var childNodes = $(this).parents(".has-child").find(".level_1 input:checked");
                $(childNodes).each(function () {
                    tempArray.push($(this).val());
    
                    if (tempArray.length !== 0 && childValues.indexOf("division") > -1) {
                        childValues += ';' + tempArray.toString();
                        tempArray = [];
                    }
                    else if (tempArray.length !== 0) {
                        childValues += '&division=' + tempArray.toString();
                        tempArray = [];
                    }
                });
    
            }
    
        })
    
        $(".accordion--businessarea__filters .no-child > div.checkbox input").each(function () {
            if (this.checked) {
                tempArray.push($(this).val());
                if (tempArray.length !== 0 && parentValues.indexOf("businessArea") > -1) {
                    parentValues += ';' + tempArray.toString();
                    tempArray = [];
                }
                else {
                    parentValues += '&businessArea=' + tempArray.toString();
                    tempArray = [];
                }
            }
        });

         $($(".accordion--format__filters li").find("input:checked")).each(function () {
            tempArray.push($(this).val());
        })
        if (tempArray.length !== 0) {
            if(tempArray.length===2){
                collectedValues += '&format=' +tempArray[0]+" and "+tempArray[1];
            }
            else {
                collectedValues += '&format=' + tempArray.join(";");
            }
            tempArray = [];
        }

        $($(".accordion--audience__filters li").find("input:checked")).each(function () {
            tempArray.push($(this).val());
        })
        if (tempArray.length !== 0) {
            collectedValues += '&audience=' + tempArray.join(";");
            tempArray = [];
        }

        if (parentValues.length > 0 || childValues.length > 0) {
            collectedValues += parentValues + childValues;
        }
    
    
    
        $($(".accordion--educationlevel__filters li").find("input:checked")).each(function () {
            tempArray.push($(this).val());
        })
        if (tempArray.length !== 0) {
            collectedValues += '&educationLevel=' + tempArray.join(";");
            tempArray = [];
        }

        $($(".accordion--programtype__filters li").find("input:checked")).each(function () {
            tempArray.push($(this).val());
        })
        if (tempArray.length !== 0) {
            collectedValues += '&type=' + tempArray.join(";");
            tempArray = [];
        }

                if(experienceHire) { 
             tempArray.push($($(".events .accordion--jobslevel__filters li").find("input:checked")).val());
        }
        else {
             tempArray.push($($(".events .accordion--jobslevel__filters li").find("input:checked")).val());
        }

    
        if (tempArray.length !== 0) {
            collectedValues += '&lang=' + tempArray.join(";");
            tempArray = [];
        }

      //  console.log(window.location + '?category=sg' + collectedValues);    
        return collectedValues;

    }
/*
 * Fetch Opportunity - Result Set
 */

var EVENTS_AGGREGATE_CLASS = "cmp-events-aggregate",
EVENTS_AGGREGATE_BTN_SELECTOR= ".cmp-events-aggregate .button--done",
REMOVE_BUTTON_SELECTOR = ".location-dropdown .remove-selection";
var resultEventsData={
    totalResults: 0
};
$(document).ready(function () {
    
    eventsDoneClick();

    $( window ).resize(function() {
        if(window.innerWidth>1024){
            $(".cmp-events-aggregate .floatingMenu").hide();
            $(".cmp-events-aggregate .floatingMenu").removeClass("topMenu");
            $(".cmp-events--filter__accordion").show();
            if(resultEventsData.totalResults !== 0) {
                $(".cmp-events--result__set").show();
                $(".cmp-events--filter--resultset .resultsFound").show();
                $(".cmp-events--filter--resultset .resultsSort").show();
            }else {
               // $(".cmp-events--result__set").hide();
            }
        }else {
            if(resultEventsData.eventResults) {
                $(".cmp-events-aggregate .floatingMenu").show();
                if($(".cmp-events-aggregate .floatingMenu").hasClass("topMenu")) {
                    $(".cmp-events--filter__accordion").show();
                } else {
                    $(".cmp-events--filter__accordion").hide();
                    $(".cmp-events--filter--resultset .resultsFound").show();
                    if(resultEventsData.totalResults !== 0) {
                        $(".cmp-events--filter--resultset .resultsFound").show();
                        $(".cmp-events--filter--resultset .resultsSort").show();
                    }
                    else {
                        $(".resultsSort").hide();
                    }
                }
            }
        }
    
        // if(window.innerWidth >= 768 && intialWindowWidth < 768) {
        //     location.reload();
        // } 
        // if(intialWindowWidth >= 768 && window.innerWidth < 768) {
        //     location.reload();
        // }

        // if(window.innerWidth>767) {
        //     if(intialWindowWidth<767) {
        //         location.reload();
        //     }
        // }else {
        //     if(intialWindowWidth>767) {
        //         location.reload();
        //     }
        // }
      });

$(".cmp-events-aggregate .floatingMenu .action-button").on("click", function() {
    $(".cmp-events--filter__accordion").toggle();
    $(".cmp-events--result__set").toggle();
  // $(".resultsFound").toggle();
   // $(".resultsSort").toggle();
    $(".cmp-events-aggregate .floatingMenu").toggleClass("topMenu");
    $(this).blur();
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
});

$(EVENTS_AGGREGATE_BTN_SELECTOR).on('click', function() {
    $(".cmp-events--filter__slick.slick-initialized").slick('slickUnfilter');
    $(".cmp-events--filter__slick.slick-initialized").slick('unslick');
    $(".cmp-events--filter--resultset").removeClass("slick--enabled");
    $(".cmp-events--filter--resultset").prev().hide();
    $(".helpUs, .what--looking--title, .nextButton").hide();
    if(window.innerWidth <= 1024) {
        $(".cmp-events-aggregate .floatingMenu").show();
        $(".cmp-events--filter__accordion").hide();
    }
    $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").show();
    if(experienceHire) {
        $(".cmp-events--filter--resultset.events").show();
        $(".cmp-events--filter--resultset.studentsandgrads").hide();
    //    expHireResutSet();

    }
    else {
        $(".cmp-events--filter--resultset.events").hide();
        $(".cmp-events--filter--resultset.studentsandgrads").show();
        studGrandsResutSet();

    }
    $(REMOVE_BUTTON_SELECTOR).on("click", deleteHandler);
    //$(".cmp-events--filter--resultset").css("display","grid");
    bindAccordioCheckBox();

    var getQueryParams = getSelectedValues();
	createRequestEventsResultSet(getQueryParams);
});

});


var global_var;
function fetchEventsResultSet(jsonPath) {
    let jsonData;
    $.ajax({
        type: "GET",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        url: jsonPath,
        async: false,
        contentType: 'text/plain',
        dataType: 'json',
        success: function ( result ) {
            jsonData = result;
        },
        failure: function( response ) {
            console.log( "failure: response: " + response );
        }
    });
    global_var = 1;
    return jsonData;
}

let eventCurrentPage = 1;
let eventOptions = {
"records_per_page": 10
}

function selectFilterByEventOptionsByKeyword(keywordFilteredResultArr) {

    const businessAreaArr = [];
    const educationLevelArr = [];
    const programTypeArr = [];
    const audienceArr = [];
    const formatArr = [];

    keywordFilteredResultArr.forEach(function(item) {

        if(item.businessArea) {
            if (businessAreaArr.indexOf(item.businessArea)==-1) {
                businessAreaArr.push(item.businessArea);
            }
        }
        if(item.educationLevel) {
            const splitArr = item.educationLevel.split(",");
            for(i=0;i<splitArr.length;i++) {
                if (educationLevelArr.indexOf(splitArr[i])==-1) {
                    educationLevelArr.push(splitArr[i]);
                }
            }

            /*if (educationLevelArr.indexOf(item.educationLevel)==-1) {
            educationLevelArr.push(item.educationLevel);
            console.log(item.educationLevel);
            }*/
        }
        if(item.eventType) {
            if (programTypeArr.indexOf(item.eventType)==-1) {
                programTypeArr.push(item.eventType);
            }
        }
    });
    console.log("business area array - "+businessAreaArr);
    console.log("program type array - "+programTypeArr);
    console.log("education level array - "+educationLevelArr);

    let businessInputStart = experienceHire ? '.events .accordion--businessarea__filters input[name="' : '.studentsandgrads .accordion--businessarea__filters input[value="';
    let businessInputEnd = '"]';

    $.each(businessAreaArr, function(i, val) {
		if (experienceHire) {
			val = val.trim().toLowerCase().replace(" ","-");
			$(businessInputStart+val+businessInputEnd).click();
		} else {
			if($(businessInputStart+val+businessInputEnd).length > 1) {
				$(businessInputStart+val+businessInputEnd)[0].click();
			} else {
				$(businessInputStart+val+businessInputEnd).click();
			}
		}
    });

    let educationInputStart = '.accordion--educationlevel__filters input[value="';
    let educationInputEnd = '"]';

    $.each(educationLevelArr, function(i, val) {
        $(educationInputStart+val+educationInputEnd).click();
    });

    let programInputStart = experienceHire ? '.events .accordion--programtype__filters input[value="' : '.studentsandgrads .accordion--programtype__filters input[value="';
    let programInputEnd = '"]';

    $.each(programTypeArr, function(i, val) {
        $(programInputStart+val+programInputEnd).click();
    });
    let audienceInputStart = experienceHire ? '.events .accordion--audience__filters input[value="' : '.studentsandgrads .accordion--audience__filters input[value="';
    let audienceInputEnd = '"]';

    $.each(audienceArr, function(i, val) {
        $(audienceInputStart+val+audienceInputEnd).click();
    });
    let formatInputStart = experienceHire ? '.events .accordion--format__filters input[value="' : '.studentsandgrads .accordion--format__filters input[value="';
    let formatInputEnd = '"]';

    $.each(formatArr, function(i, val) {
        $(formatInputStart+val+formatInputEnd).click();
    });

}

var pagefuncEvent = Pagination('eventPagination');
function generateEventsResult(eventResultSet,eventCurrentPage, keyword, noautoselect) {

    $(".cmp-events--result__set, .noreuslt--jobcard").empty();

    resultEventsData = eventResultSet;
    let resultsEvents = eventResultSet.eventResults;

	if (global_var == 1){
		let resultsEvents = eventResultSet.eventResults.reverse();
        global_var = 2;
        if($('.sort-down:visible').length > 0){
            $('.sort-down').css( {'transform': 'rotate(223deg)'});
            $('.sort-down').css( {'margin-bottom': '0px'});
            global_var = 3;
        }
    }else if (global_var == 3){
        if($('.sort-down:visible').length > 0){
             $('.sort-down').css( {'transform': 'rotate(223deg)'});
        }else{
             $('.sort-up').css( {'transform': 'rotate(45deg)'});
        }
    }

    totalResultsFound = eventResultSet.eventResults.length;
    let showresultSet = paginationEvents(resultsEvents,eventCurrentPage,eventOptions);
    for (let i=0; i<showresultSet.length; i++) {
        let data= showresultSet[i];
        if(data != undefined) {
            if(eventResultSet.totalResults> 0) {
                $(".cmp-events--result__set").append(getEventsResultsDiv(data));
                $(".cmp-events--result__set").show();
                $(".cmp-events--filter--resultset .resultsSort").show();
                $(".no-results-found ").hide();
                newWindowLinks();
            }
            else {
                console.log("no result found")
                $(".no-results-found ").show();
                $(".cmp-events--filter--resultset .resultsSort").hide();
                $(".cmp-events--result__set").hide();
                $('.no-results-found .noreuslt--jobcard').removeClass('cards-3 cards-2 cards-1')
                $('.no-results-found .noreuslt--jobcard').addClass('cards-'+showresultSet.length);
                $(".no-results-found .noreuslt--jobcard").append(getNoEventsResultsDiv(i, showresultSet));
            }
            $(".cmp-events--filter--resultset .resultsFound").text( eventResultSet.totalResults+" Results Found");
            if(keyword) {
                $(".cmp-events--filter--resultset .resultsFound").text( resultSet.totalResults+" Results Found For ");
                $(".cmp-events--filter--resultset .resultsFound").append('<span>"'+keyword+'"</span>');
            }        
        }
       }
    
    if(experienceHire) { 
        $(".events .cmp-events--result__set").append("<div class='events pagination' id='eventsPagination'></div>");
    }
    else {
        $(".studentsandgrads .cmp-events--result__set").append("<div class='events pagination' id='eventsPagination'></div>");
    }
    
    let eventPages = Math.ceil( eventResultSet.eventResults.length / eventOptions.records_per_page ),
        myfun = function call() {
            console.log("hello");
        };
       
        pagefuncEvent.Init(document.getElementById('eventsPagination'), {
        size: eventPages, // pages size
        page: eventCurrentPage,  // selected page
        step: 1,   // pages before and after current
        results : eventResultSet, // data to show
        changedata : generateEventsResult, // call back function for data change
        class: 'events'
    });
//    Pagination('eventPagination',eventPages, eventCurrentPage, eventResultSet,generateEventsResult, 'events','eventsPagination' );

	if(keyword && eventResultSet.totalResults > 0 && noautoselect !== "noautoselect") {
        setTimeout(function() {
			selectFilterByEventOptionsByKeyword(eventResultSet.resultSet);
        },1500);
    }

    $(".cmp-events--result__set .cmp-jobcard__link").on("click", function () {
        if (window.innerWidth < 767) {
            let url = $(this).find(".learn-more").attr("href");
            window.open(url);
        }
    });
   
    $(".cmp-events-aggregate .jobcard_arrow").click(function() {
        $(this).blur();
        let parentDiv = this.parentElement,
            analyticsVal = this.getAttribute("data-analytics-link");
        
        if ($(this).hasClass('down')) {
            $(this).removeClass('down').addClass('up');
            if(analyticsVal) $(this).attr("data-analytics-link", analyticsVal.replace("Expand", "Collapse"));
    
        } else {
            $(this).removeClass('up').addClass('down');
            if(analyticsVal) $(this).attr("data-analytics-link", analyticsVal.replace("Collapse", "Expand"));
        }
 //       $(parentDiv).find('.jobId').toggle();
        $(parentDiv).find('.description_section').toggle();
    });

	$(".cmp-events-aggregate .jobcard_arrow").on('keydown',function(event) {
         var keyCode = event.keyCode || event.which;
		 event.preventDefault();
         if(keyCode == 13 || event.keyCode == 27) {
            $(this).click().blur();
             $(".btn.learn-more").focus();
        } 
		if(keyCode == 9) {
            $(this).blur();
        }

    });


/*
    let scrollUp=320;
    if(window.innerWidth<767) {
        scrollUp = 220;
    }
    else if(window.innerWidth < 1025){
        scrollUp = 250;
    }
    window.scrollTo({
        top: scrollUp,
        left: 0,
        behavior: 'smooth'
      });
*/
      if(window.innerWidth <= 1024) {
        $(".cmp-events-aggregate .floatingMenu").show();
        $(".cmp-events--filter__accordion").hide();
    }
}

/**
 * Truncate the string on given number of character of the first line break.
 * @param { string to truncate} str 
 * @param { number of character} count 
 */
// function ellipsify (str, count) {
//     if(str) {
//         // let patt1 = /\n/;
//         // let index = str.search(patt1);
//         // if(index !== -1 && index <= count) {
//         //     count = index - 1;
//         // }
//         if (str.length > count) {
//             return (str.substring(0, count) + "...");
//         }
//         else {
//             return str;
//         }
//     }
// }


function getEventsResultsDiv(data) {
    data.opportunity = "STUDENTS & GRADUATES";
    let empType = data.opportunity=="EXPERIENCED PROFESSIONALS" ? "Job" : "Program";
    var dataLocation = data.eventCountry == null ? "" : data.eventCountry.replace("Korea, Republic of","Republic of Korea");
    var typeOfEvent = experienceHire ? "Employment Type" : "Program Type";
    var  appPostDate = experienceHire ? "Posted Date" : "Application Deadline";
    let flowType = "S&G";
    let descripton = data.eventHtmlDescription;
    var dateFormat = data.eventStartDate.split(",")[1] + ", " + data.eventStartDate.split(",")[2];

    let multiCity = dataLocation.split(",");

    var url = window.location.href;
    var arr = url.split("/");
    var contextPath = '/'+arr[3];
    var origin = window.location.origin;
    var careerUrl = '';
    
        if(arr[3] === 'content') {
            careerUrl = origin+contextPath+'/msdotcom/en/careers/students-graduates/events.' + data.eventId+ '.html?wcmmode=disabled';
        } else {
            careerUrl = origin+'/careers/students-graduates/events/' + data.eventId;
        }
    
    if(navigator.userAgent.search("MSBrowserIE") !== -1 ){ 
        descripton = ellipsify(data.eventHtmlDescription, 300)
    }
    
	if(window.innerWidth < 767) {

        if (multiCity.length > 1) {
            let childDiv = "<div class='jobcard'>" +
                "<div class='cmp-jobcard'>" +
                '<div class="cmp-jobcard__link" ' +
                'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +
                'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.eventStartDate + ' | ' + data.eventTime + '"' +
                'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +
                'data-analytics-job-url="' + data.eventDetailUrl + ' ">' +
                '<div class="cmp-jobcard__content">' +
                '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">' + data.opportunity + '</div>' +
                '<div class="cmp-jobcard__title">' + data.eventTitle + '</div>' +
                '<div class="cmp-jobcard__separator purple"></div></div>' +
                '<div class="description_section " style="display: none" >' +
                '<div>' + appPostDate + ': ' + dateFormat + '</div>' +
                '<div>' + typeOfEvent + ': ' + data.eventType + '</div>' +
                '<div class="apply_button"><a class="button--done" ' +
                'href="' + data.eventDetailUrl + '" target="_blank">Register Now</a></div>' +
                // '<h4>'+empType+' Description </h4>' +
                // '<div class="description_text">' + data.eventHtmlDescription + '</div>' +
                '<div class="CTA-button"><a class="btn learn-more"' +
                'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Learn More"' +
                'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.businessUnit + ' | ' + data.eventId + '"' +
                'href="' + careerUrl + '" target="_blank">Learn More</a> </div></div>' +
                '<div class="role_city_section"><div class="cmp-jobcard__role">' + dateFormat + '</div>' +
                '<div class="cmp-jobcard__location">Multiple Locations</div>' +
                '<div class="jobcard_arrow down" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Expand"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            return childDiv;
        }

        else {
            let childDiv = "<div class='jobcard'>" +
                "<div class='cmp-jobcard'>" +
                '<div class="cmp-jobcard__link" ' +
                'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +
                'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.businessUnit + ' | ' + data.eventType + ' | ' + data.eventId + '"' +
                'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +
                'data-analytics-job-url="' + data.eventDetailUrl + ' ">' +
                '<div class="cmp-jobcard__content">' +
                '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">' + data.opportunity + '</div>' +
                '<div class="cmp-jobcard__title">' + data.eventTitle + '</div>' +
                '<div class="cmp-jobcard__separator purple"></div></div>' +
                '<div class="description_section " style="display: none" >' +
                '<div>' + appPostDate + ': ' + dateFormat + '</div>' +
                '<div>' + typeOfEvent + ': ' + data.eventType + '</div>' +
                '<div class="apply_button"><a class="button--done" ' +
                'href="' + data.eventDetailUrl + '" target="_blank">Register Now</a></div>' +
                // '<h4>'+empType+' Description </h4>' +
                // '<div class="description_text">' + data.eventHtmlDescription + '</div>' +
                '<div class="CTA-button"><a class="btn learn-more"' +
                'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Learn More"' +
                'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.businessUnit + ' | ' + data.eventId + '"' +
                'href="' + careerUrl + '" target="_blank">Learn More</a> </div></div>' +
                '<div class="role_city_section"><div class="cmp-jobcard__role">' + dateFormat + '</div>' +
                '<div class="cmp-jobcard__location">' + dataLocation + '</div>' +
                '<div class="jobcard_arrow down" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Expand"></div>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            return childDiv;
        }
    }
    else if(multiCity.length > 1) {
        window.scrollTo(0, 0);
        let location_descripton = dataLocation.replace(/,/g, ', ');
        locations ='';
        let childDiv = "<div class='jobcard'>"+
                "<div class='cmp-jobcard'>"+
                    '<div class="cmp-jobcard__link" >'+
                        '<div class="cmp-jobcard__content">'+
                            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">'+ data.opportunity + '</div>'+
                            '<div class="cmp-jobcard__title">'+ data.eventTitle +'</div>'+
                            '<div class="cmp-jobcard__separator purple"></div></div>'+

                            '<div class="role_city_section"><div class="cmp-jobcard__role">'+ dateFormat +'</div>' +
                            '<div class="cmp-jobcard__location">Multiple Locations<br>(see below)</div>'+
                            '<div class="jobId"><span> '+data.businessUnit + '</span>' +
                            '<div>'+ data.eventFormat +'</div></div></div>'+
                            '<div class="apply_button"><a class="button--done" ' + 
                            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' + 
                            'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' + 
                            'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.eventStartDate + ' | ' + data.eventTime + '"' +
                            'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +                      
                            'href="'+ data.eventDetailUrl + '" target="_blank">Register Now</a></div>' +
                            '<div class="jobcard_arrow down"  tabindex="0" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Expand"></div>' +
                            '<div class="event-audience">Event Type: '+ data.eventAudience +'</div>' +
                            '<div class="typeof-event">Audience: ' + data.eventType + '</div>' +                                
                           '<div class="description_section " style="display: none" >' +
                            '<h4>Locations</h4>' +
                            '<div class="description_text">' + location_descripton + '</div>' +
                            '<h4>Event Description </h4>' +
                            '<div class="description_text">' + descripton + '</div>' +
                            '<div class="CTA-button"><a class="btn learn-more" tabindex="0" ' +
                            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Learn More"' +
                            'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                            'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.businessUnit + ' | ' + data.eventId + '"' +
                            'href="'+ careerUrl + '" target="_blank">Learn More</a> </div></div>' + 
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
            $(".description_text p, .description_text span, .description_text ul, .description_text li, .description_text table, .description_text h1, .description_text h2, .description_text h3, .description_text h4, .description_text h5, .description_text h6, .description_text div, .description_text font").removeAttr("style");
            $(".description_text .MsoNormal").attr("face","").attr("size","").attr("color","");
            $(".description_text font").attr("face","").attr("size","").attr("color","");
            $('.description_text p, .description_text span, .description_text div, .description_text table, .description_text tr, .description_text td').each(function(){
                if( $(this).text().trim() === '' )
                    $(this).remove(); 
            });
            $(".description_text p").html(function (i, html) {
                return html.replace(/&nbsp;/g, ' ');
            });       
	return childDiv;

    }
    else {
        window.scrollTo(0, 0);
    let childDiv = "<div class='jobcard'>"+
                "<div class='cmp-jobcard'>"+
                    '<div class="cmp-jobcard__link" >'+
                        '<div class="cmp-jobcard__content">'+
                            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">'+ data.opportunity + '</div>'+
                            '<div class="cmp-jobcard__title">'+ data.eventTitle +'</div>'+
                            '<div class="cmp-jobcard__separator purple"></div></div>'+

                            '<div class="role_city_section"><div class="cmp-jobcard__role">'+ dateFormat +'</div>' +
                            '<div class="cmp-jobcard__location">'+ dataLocation +'</div>'+
                            '<div class="jobId"><span> '+data.businessUnit + '</span>' +
                            '<div>'+ data.eventFormat +'</div></div></div>'+
                            '<div class="apply_button"><a class="button--done" ' + 
                            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' + 
                            'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' + 
                            'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.eventStartDate + ' | ' + data.eventTime + '"' +
                            'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Register Now"' +                      
                            'href="'+ data.eventDetailUrl + '" target="_blank">Register Now</a></div>' +
                            '<div class="jobcard_arrow down"  tabindex="0" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Expand"></div>' +
                            '<div class="event-audience">Event Type: '+ data.eventAudience +'</div>' +
                            '<div class="typeof-event">Audience: ' + data.eventType + '</div>' +                                
                           '<div class="description_section " style="display: none" >' +
                           '<h4>Event Description </h4>' +
                            '<div class="description_text">' + descripton + '</div>' +
                            '<div class="CTA-button"><a class="btn learn-more" tabindex="0" ' +
                            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | Learn More"' +
                            'data-analytics-module="Event Card | ' + data.eventTitle + ' | NA"' +
                            'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + dataLocation + ' | ' + data.eventType + ' | ' + data.businessUnit + ' | ' + data.eventId + '"' +
                            'href="'+ careerUrl + '" target="_blank">Learn More</a> </div></div>' + 
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>';
            $(".description_text p, .description_text span, .description_text ul, .description_text li, .description_text table, .description_text h1, .description_text h2, .description_text h3, .description_text h4, .description_text h5, .description_text h6, .description_text div, .description_text font").removeAttr("style");
            $(".description_text .MsoNormal").attr("face","").attr("size","").attr("color","");
            $(".description_text font").attr("face","").attr("size","").attr("color","");
            $('.description_text p, .description_text span, .description_text div, .description_text table, .description_text tr, .description_text td').each(function(){
                if( $(this).text().trim() === '' )
                    $(this).remove(); 
            });
            $(".description_text p").html(function (i, html) {
                return html.replace(/&nbsp;/g, ' ');
            });
	return childDiv;
    }
}

function getNoEventsResultsDiv(index, showResultSet) {
    let data = showResultSet[index], count = 0;
    data.opportunity = "STUDENTS & GRADUATES";
    var getLangSelection;
    for (let i=0; i<showResultSet.length; i++) {
        if(showResultSet[i]) count++;
    }
    if(experienceHire) {
    	getLangSelection = $($(".events .accordion--jobslevel__filters li").find("input:checked")).val();
    }
    else {
		getLangSelection = $($(".studentsandgrads .accordion--jobslevel__filters li").find("input:checked")).val();
    }
    if(getLangSelection === "FR") {
        $(".noresults-description").text("Il n’y a présentement aucune événement qui réponde à ce critère. Veuillez choisir de nouveaux filtres afin d’obtenir de nouveaux résultats.");
    }
    else {
		 $(".noresults-description").text("There are currently no upcoming events that match your search criteria. Please choose other filters to see different results.");
    }
    var dataLocation = data.eventCountry == null ? "" : data.eventCountry.replace("Korea, Republic of","Republic of Korea");
    var typeOfEvent = experienceHire ? "Employment Type" : "Program Type";
    var  appPostDate = experienceHire ? "Posted Date" : "Application Deadline";
    var dateFormat = data.eventStartDate.split(",")[1] + ", " + data.eventStartDate.split(",")[2];
    var multiLocations = dataLocation.split(",");
    if(multiLocations.length>1) {
        multiLocations = "Multiple Locations";
    }
    else {
        multiLocations = dataLocation;
    }
    let flowType = "S&G",
        childDiv = "<div class='jobcard'>"+
                "<div class='cmp-jobcard'>"+
                    '<a class="cmp-jobcard__link" href="'+ data.eventDetailUrl + '" target="_blank"' +
                    'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.eventTitle + ' | NA"' + 
                    'data-analytics-module="Compact Event Card | ' + data.eventTitle + ' | position ' + (index + 1) + ' of ' + count + '"' + 
                    'data-analytics-event-card="' + flowType + ' | ' + data.eventTitle + ' | ' + multiLocations + ' | ' + data.eventType + ' | ' + data.eventStartDate + ' | ' + data.eventTime + ' | NA | NA">'+
                        '<div class="cmp-jobcard__content">'+
                            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">'+ data.opportunity + '</div>'+
                            '<div class="cmp-jobcard__title">'+ data.eventTitle +'</div>'+
                            '<div class="cmp-jobcard__separator purple"></div></div>'+
                            '<div class="description_section " style="display: none" >' +
                            '<div>'+ appPostDate +': ' + dateFormat +'</div>' +
                            '<div>'+ typeOfEvent +': ' + data.eventType + '</div>' +
                          //  '<h4>Job Description </h4>' +
                          //  '<div class="description_text">' + data.eventHtmlDescription + '</div>' +
                            '<div class="CTA-button"><span class="btn learn-more">Learn More</span> </div></div>' + 
                            '<div class="role_city_section"><div class="cmp-jobcard__role">'+ dateFormat +'</div>' +
                            '<div class="cmp-jobcard__location">'+ multiLocations +'</div>'+
                            '<div class="jobId"> Job # '+ data.eventId + '</div></div>'+
                            '<div class="apply_button"><span class="button--done">Register Now</span></div>' +
                            '<div class="jobcard_arrow down"></div>' +
                        '</div>'+
                    '</a>'+
                '</div>'+
            '</div>';
	return childDiv;
}

/**
* Finds out the ancestor of the current element based on the class name
* @param {*Current element} el 
* @param {*Ancestor className} cls 
*/
function findAncestor(el, cls) {
while ((el = el.parentElement) && !el.classList.contains(cls));
return el;
}

/**
* paginationating the data 
* @param {*Which page data to show} eventCurrentPage
* @param {* other parameters} eventOptions
*/	
function paginationEvents(data, eventCurrentPage, eventOptions) {
let newArray= [];
for(let i=(eventCurrentPage - 1) * eventOptions.records_per_page; i < (eventCurrentPage * eventOptions.records_per_page ) ; i++) {
    if(data[i])
    newArray.push(data[i]);
}
return newArray;
}


$(document).ready(function () {
    const eventDetailComp = $(".cmp-eventdetail-container");
    if(eventDetailComp == undefined && eventDetailComp.length <=0 ){
        return;
    }
    var url = window.location.href;
    if (url.indexOf('students-graduates/events') > -1) {
        var splitURL = url.split("/");
        var contextPath = '/' + splitURL[3];

        if (splitURL[splitURL.length - 1] !== 'not-found') {
            var jobDataArray = getevenTypeVariation();
            var pageNotFound;
            if (jobDataArray[1]) {
                if (MSCOM.pageData.isAuthor) {
                    pageNotFound = origin + contextPath + '/content/msdotcom/en/career/events-aggregate/not-found';

                } else {
                    pageNotFound = origin + '/career/events-aggregate/not-found';
                }
                window.location.replace(pageNotFound);

            } else {
                getEventExprienceFrgments(jobDataArray[0]);
            }
        }
    }

});

function getevenTypeVariation() {
    var eventTypeVariation = "";
    var eventIDNotFound = true;
    var careerURL, heroCareerEyeBrow, postLabel;
    var eventNo = $(".cmp-eventdetail-container").attr('event-id');

    if (eventNo == undefined) {
        eventIDNotFound = false;
    } else {
        eventIDNotFound = true;
    }

    var getURLString = window.location.pathname.search("students-graduates/events");

    if (getURLString > -1) {
        careerURL = window.location.origin + "/web/career_services/webapp/service/careerservice/eventdetails.json?category=sg";
        heroCareerEyeBrow = "STUDENTS & GRADUATES";
        postLabel = "Application Deadline";
    }
    const eventDetailComp = $(".cmp-eventdetail-container");
    if(eventDetailComp == undefined && eventDetailComp.length <=0 ){
        return;
    }

    $.ajax({
        url: careerURL,
        async: false,
        method: "GET",
        contentType: 'application/json',
        dataType: "json",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            var html_to_append = '';
            $.each(data.eventResults, function (i, item) {
                if (this.eventId == eventNo) {
                    this.opportunity = "STUDENTS & GRADUATES";
                    eventIDNotFound = false;
                    eventTypeVariation = this.eventType;

                    return false;
                }
            });
        },
        error: function (data) {
            console.log(data);
        }
    });

    var jobDataArray = [eventTypeVariation, eventIDNotFound]
    return jobDataArray;
}

function getEventTitleAndDescription() {
    var eventTypeVariation = "";
    var eventIDNotFound = true;
    var careerURL, heroCareerEyeBrow, postLabel;
    var eventNo = $(".cmp-eventdetail-container").attr('event-id');

    if (eventNo == undefined) {
        eventIDNotFound = false;
    } else {
        eventIDNotFound = true;
    }

    var getURLString = window.location.pathname.search("students-graduates/events");


    if (getURLString > -1) {
        careerURL = window.location.origin + "/web/career_services/webapp/service/careerservice/eventdetails.json?category=sg";
        heroCareerEyeBrow = "STUDENTS & GRADUATES";
        postLabel = "Application Deadline";
    }

    const eventDetailComp = $(".cmp-eventdetail-container");
    if(eventDetailComp == undefined && eventDetailComp.length <=0 ){
        return;
    }
    $.ajax({
        url: careerURL,
        async: false,
        method: "GET",
        contentType: 'application/json',
        dataType: "json",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            var html_to_append = '';
            $.each(data.eventResults, function (i, item) {
                if (this.eventId == eventNo) {
                    this.opportunity = "STUDENTS & GRADUATES";
                    eventIDNotFound = false;
                    eventTypeVariation = this.eventType;
                    var dataLocation = this.eventCountry == null ? "" : this.eventCountry.replace("Korea, Republic of", "Republic of Korea");
                    let multiCity = dataLocation.split(",");
                    let location_descripton = dataLocation.replace(/,/g, ', ');

                    if (multiCity.length > 1) {
                        html_to_append = '<div><h2 class="job-description">Location</h2></div>';

                        html_to_append += location_descripton;
                        html_to_append += '<div><h2 class="job-description">Event Description</h2></div>';

                        html_to_append += this.eventHtmlDescription;
                        dataLocation = 'Multiple Locations (See below)'
                    } else {
                        html_to_append = '<div><h2 class="job-description">Event Description</h2></div>';

                        html_to_append += this.eventHtmlDescription;
                    }


                    let businessAreaLabel = this.businessUnit == null ? "" : this.businessUnit;
                    let divisionLabel = this.businessUnit == null ? "" : this.businessUnit;
                    let seprateChar = " | "
                    if (businessAreaLabel === divisionLabel) {
                        divisionLabel = "";
                    }
                    if (businessAreaLabel == "" || divisionLabel == "") {
                        seprateChar = " ";
                    }

                    $(".cmp-eventdetail-container .shortTitle__parent_eyebrow").empty();
                    $(".cmp-eventdetail-container .shortTitle__parent_eyebrow").text(capitalizeString(this.opportunity));
                    $(".cmp-eventdetail-container .detailsherotitle").html(this.eventTitle);
                    $(".detailsherotitle").after('<div class="event-businessarea">' + businessAreaLabel + '</div>' +
                        '<div class="event-type">' + this.eventFormat + '</div>' +
                        '<div class="event-date">' + this.eventStartDate + '</div>' +
                        '<div class="event-time">' + this.eventTime + '</div>' +
                        '<div class="event-location">' + dataLocation + '</div>' +
                        '<div class="apply_button"><a class="button--done" data-analytics-link = "S&G | Event Hero | ' + this.eventTitle + ' | Register Now" data-analytics-module = "Event Hero | ' +
                        this.eventTitle + ' | NA' + '" data-analytics-event-card = "S&G | ' + this.eventTitle + ' | ' + this.eventCountry + ' | ' + ' | ' + this.eventStartDate + ' | ' + this.eventTime +
                        this.businessUnit + ' | ' + this.eventType + ' | ' + this.eventId + '" data-analytics-button-cta = "S&G | Event Hero | ' +
                        this.eventTitle + ' | Register Now" href="' + this.eventDetailUrl + '" target="_blank">Register Now</a></div>');


                    $($('.midweight-cta')[0]).find(".button--firstCtaLink").attr("href", this.eventDetailUrl).attr('target', '_blank');

                    if (this.allBusinessArea === null) {
                        this.allBusinessArea = "";
                    }

                    if (this.dbBusinessUnit === null) {
                        this.dbBusinessUnit = "";
                    }
                    renderOpportunities(this.allBusinessArea, this.applicationPortalRegion, this.eventCountry, this.eventId);
                    window.scrollTo(0, 0);

                    /* Updated the social share links*/
                    let twitterURL = "https://twitter.com/share?url=" + window.location.href;
                    $(".share-twitter").attr("href", twitterURL);

                    let linkedinURL = "https://www.linkedin.com/shareArticle?mini=true&url=" + window.location.href;
                    $(".share-linkedin").attr("href", linkedinURL);

                    let facebookURL = "https://www.facebook.com/sharer/sharer.php?u=" + window.location.href;
                    $(".share-facebook").attr("href", facebookURL);

                    let emailContent = "mailto:?body=Check out this upcoming event with Morgan Stanley: " + window.location.href + "&subject=Check out this upcoming event with Morgan Stanley - " + window.document.title;
                    $(".share-email").attr("href", emailContent);

                    /* Update URL for CTA button*/
                    if ($($('.midweight-cta')[1]).find(".button--firstCtaLink").length > 0) {
                        let url = window.location.href;
                        let arr = url.split("/");
                        if (arr[3] !== 'auth' || arr[3] !== 'pub') {
                            let urlString = $($('.midweight-cta')[1]).find(".button--firstCtaLink").attr('href');
                            let updatedHref = urlString.split('/msdotcom/en')[1];
                            $($('.midweight-cta')[1]).find(".button--firstCtaLink").attr("href", updatedHref);

                            $(".cmp-eventdetail-container .more-insights .storycard .cmp-storycard__link").each(function () {
                                let urlStringMWC = $(this).attr('href');
                                let updatedHrefMWC = urlStringMWC.split('/msdotcom/en')[1];
                                $(this).attr("href", updatedHrefMWC);
                            });

                            $(".cmp-eventdetail-container .meet-the-team .cmp-personcard__link").each(function () {
                                let urlStringProfile = $(this).attr('href');
                                let updatedHrefProfile = urlStringProfile.split('/msdotcom/en')[1];
                                $(this).attr("href", updatedHrefProfile);
                            });

                        }

                    }
                    $(".cmp-eventdetail-container .shortTitle__parent_eyebrow").click(function () {
                        window.open(studentGraduatesPoint);
                    });
                    return false;
                }
            });
            $(".cmp-eventdetail-container .decription").html(html_to_append);

            $(".decription p, .decription span, .decription ul, .decription li, .decription table, .decription h1, .decription h2, .decription h3, .decription h4, .decription h5, .decription h6, .decription div, .decription font").removeAttr("style");
            $(".decription .MsoNormal").attr("face", "").attr("size", "").attr("color", "");
            $(".decription font").attr("face", "").attr("size", "").attr("color", "");
            $('.decription p, .decription span, .decription div, .decription table, .decription tr, .decription td').each(function () {
                if ($(this).text().trim() === '')
                    $(this).remove();
            });
            $(".decription p").html(function (i, html) {
                return html.replace(/&nbsp;/g, ' ');
            });

            $(".details-description a").each(function (index) {
                $(this).attr("data-analytics-link", $('.detailsherotitle').text().trim() + " | Body-Text Link | " + $(this).text().trim());
            });
            newWindowLinks();

        },
        error: function (data) {
            console.log(data);
        }
    });

    var jobDataArray = [eventTypeVariation, eventIDNotFound]
    return jobDataArray;

}

function getEventExprienceFrgments(eventTypeVariation) {

    /* Mid Weight-CTA */

    var $eventMidWeightCta = $('.midweight-cta');
    var origin = window.location.origin;
    var eventExperienceFragmentPath = '/content/experience-fragments/msdotcom/students_graduates/events/dynadata/event-details';

    switch (eventTypeVariation) {
        case 'Career Fair':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/career-fair.html';
            break;
        case 'Conference':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/conference.html';
            break;
        case 'Diversity':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/diversity.html';
            break;
        case 'Learning and Development':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/learning-and-development.html';
            break;
        case 'Networking':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/networking.html';
            break;
        case 'Presentation':
            expFragmentUrl = origin + eventExperienceFragmentPath + '/presentation.html';
            break;
        default:
            expFragmentUrl = origin + eventExperienceFragmentPath + '/master.html';
    }

    $.ajax({
        url: expFragmentUrl,
        async: false,
        type: 'GET',
        success: function (data) {

            $.each($eventMidWeightCta, function (i, key) {
                $(this).html($(data).find('.mid-weight-cta')[i]).html();
            });

            $(".events-hero").html($(data).find('.detailsHero')).html();
            $(".event-inline-social").html($(data).find('.inlinesocial')).html();

            $(".event-twoup-cards").html($(data).find('.four-up__style')[1]).html();
            $.each($('.four-up__style'), function (i, key) {
                if (i == 0)
                    $('.upcoming-events').html($(data).find('.endlessgrid-title')[0]).html();
                if (i == 1)
                    $('.event-twoup-cards').html($(data).find('.four-up__style')).html()
                if (i == 2)
                    $('.realted-opportunity').html($(data).find('.endlessgrid-title')[1]).html();
            });

            $(".upcoming-events").html($(data).find('.four-up__style')[0]).html();
            $(".realted-opportunity").html($(data).find('.four-up__style')[2]).html();

            let eventStoryCardClass = $(".practicecard.aem-GridColumn.aem-GridColumn--default--12");

            $.each(eventStoryCardClass, function (i, key) {
                $(this).addClass("aem-GridColumn--default--6");
            });


            getEventTitleAndDescription();
        }
    });

    /* Mid Weight-CTA Ends*/
}

function renderOpportunities(businessArea, eventRegion, eventCountry, eventId) {

    var origin = window.location.origin;
    var locationAndBusiness, onlyLocation = "";
    var collectedLocations = "";
    var businessAreaValues = businessArea.replace(",",";");


	var loacationRegionValue = eventRegion.split(',');
    var loacationCountryValue = eventCountry.split(',');

    if (loacationRegionValue.length > 1) {
        if (loacationCountryValue) {
            var queryParamaters = {
                country: loacationCountryValue
            };
            collectedLocations = getQueryParamaters(queryParamaters, 'events');
        }
        var getAllRegions = collectedLocations.split(".")[0];
        loacationRegionValue = loacationRegionValue.filter(function (val) {
            return getAllRegions.indexOf(val) == -1;
        });

        var queryParamaters = {
            region: loacationRegionValue,
            country: loacationCountryValue
        };
        collectedLocations = getQueryParamaters(queryParamaters,'events');
    }
    else {
        var queryParamaters = {
            country: loacationCountryValue
        };
        collectedLocations = getQueryParamaters(queryParamaters,'events');
    }

    if (MSCOM.pageData.isAuthor) {
        locationAndBusiness = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/resultset.json?opportunity=sg'+"&location="+collectedLocations+"&businessArea="+businessAreaValues;
        onlyLocation = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/resultset.json?opportunity=sg'+"&location="+collectedLocations;
    }
    else {
        locationAndBusiness = origin+'/web/career_services/webapp/service/careerservice/resultset.json?opportunity=sg'+"&location="+collectedLocations+"&businessArea="+businessAreaValues;
        onlyLocation = origin+'/web/career_services/webapp/service/careerservice/resultset.json?opportunity=sg'+"&location="+collectedLocations;
    }

    var recordsCount =  getRealtedOpportunityRecords(locationAndBusiness);
    if(recordsCount.length >= 4 && recordsCount.totalResults >= 4) {
        relatedOpportunity(recordsCount);
    }
    else {
        var recordsCount =  getRealtedOpportunityRecords(onlyLocation);
        relatedOpportunity(recordsCount);
    }


    function getRealtedOpportunityRecords(urlParams) {
        var getResult = [];
        $.ajax({  
            url: urlParams,
            method: "GET",
            async: false,
            contentType:'application/json',
            dataType: "json",
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function(data) {
              getResult = data.eventResults !== null ? data.resultSet : [] ;
              return getResult;
            },
            error: function() {
            }
        });
        return getResult;
    }


    if (MSCOM.pageData.isAuthor) {
        upComingEventsLocation = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&location="+collectedLocations+"&eventId="+eventId;
        upComingEventsFormat = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&format=Virtual&businessArea="+businessAreaValues+"&eventId="+eventId;
        upComingEventsBusiness = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&businessArea="+businessAreaValues+"&eventId="+eventId;
        upComingEventsDefault = 'http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&eventId="+eventId;
    }
    else {
        upComingEventsLocation = origin+'/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&location="+collectedLocations+"&eventId="+eventId;
        upComingEventsFormat = origin+'/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&format=Virtual&businessArea="+businessAreaValues+"&eventId="+eventId;
        upComingEventsBusiness = origin+'/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&businessArea="+businessAreaValues+"&eventId="+eventId;
        upComingEventsDefault = origin+'/web/career_services/webapp/service/careerservice/upcomingevents.json?category=sg'+"&eventId="+eventId;
    } 

    var upComingrecordsCount = getUpComingEvents(upComingEventsLocation);
    if (upComingrecordsCount.eventResults !== null && upComingrecordsCount.eventResults.length >= 4 && upComingrecordsCount.totalResults >= 4) {
        upComingEventsOpportunity(upComingrecordsCount.eventResults);
    }
    else {
        var upComingrecordsCount = getUpComingEvents(upComingEventsFormat);
        if (upComingrecordsCount.eventResults !== null && upComingrecordsCount.eventResults.length >= 4 &&  upComingrecordsCount.totalResults >= 4) {
            upComingEventsOpportunity(upComingrecordsCount.eventResults);
        }
        else {
            var upComingrecordsCount = getUpComingEvents(upComingEventsBusiness);
            if (upComingrecordsCount.eventResults !== null && upComingrecordsCount.eventResults.length >= 4 &&  upComingrecordsCount.totalResults >= 4) {
                upComingEventsOpportunity(upComingrecordsCount.eventResults);
            }
            else {
                var upComingrecordsCount = getUpComingEvents(upComingEventsDefault);
                upComingEventsOpportunity(upComingrecordsCount.eventResults);
            }
        }
    }

function getUpComingEvents(eventsURL) {
    const eventDetailComp = $(".cmp-eventdetail-container");
    if(eventDetailComp == undefined && eventDetailComp.length <=0 ){
        return;
    }
    var result = [];
        $.ajax({
            url: eventsURL,
            method: "GET",
            async: false,
            contentType: 'application/json',
            dataType: "json",
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                return data;
            },
            error: function () {
            }
        });
        return result;
    }
}

function relatedOpportunity (data) {
    if(data != null && data.length >= 4) {
    var html_to_append = "";
    for(var count=0; count < 4; count++) {
        if(arr[3] === 'content') {
            careerUrl = origin+contextPath+'/msdotcom/en/careers/students-graduates/opportunities.' + data[count].jobNumber+ '.html?wcmmode=disabled';
        } else {
            careerUrl = origin+'/careers/students-graduates/opportunities/' + data[count].jobNumber;
        }
        html_to_append += '<div class="jobcard">'
        +'<div class="cmp-jobcard">'
        +'<a href="'+careerUrl+'" '
        +'class="cmp-jobcard__link"' 
        +'data-analytics-module="Related Opportunities | '+data[count].jobTitle+' | position '+(count+1)+' of 4 "'
        +'data-analytics-link="STUDENTS &amp; GRADUATES | '+data[count].jobTitle+' | '+data[count].businessArea+'" '
        +'data-analytics-job-card="S&amp;G | '+data[count].jobTitle+' | '+data[count].country+' | '+data[count].businessArea+' ">'
        +'<div class="cmp-jobcard__content">'
        +'<div class="cmp-jobcard__eyebrow">'+data[count].opportunity+'</div>'
        +'<div class="cmp-jobcard__title">'+data[count].jobTitle+'</div>'
        +'<div class="cmp-jobcard__separator purple"></div><div class="cmp-jobcard__role">'+data[count].businessArea+'</div>'
        +'<div class="cmp-jobcard__location">'+data[count].country+'</div>'
        +'</div>'
        +'</a>'
        +'</div>'
        +'</div>'
    }

    $('.realted-opportunity .endlessgrid-content').after('<div class="event-cards"></div>')
    $(".realted-opportunity .event-cards").html(html_to_append);
    }
    else {
		$(".realted-opportunity").hide();
    }
}

function upComingEventsOpportunity (data) {
    if(data != null && data.length >= 4) {
    var html_to_append = "";
    for(var record=0; record < 4; record++) {
        //console.log("key===",data[key])
        if(arr[3] === 'content') {
            eventUrl = origin+contextPath+'/msdotcom/en/careers/students-graduates/events.' + data[record].eventId+ '.html?wcmmode=disabled';
        } else {
            eventUrl = origin+'/careers/students-graduates/events/' + data[record].eventId;
        }
        var dateFormat = data[record].eventStartDate.split(",")[1] + ", " + data[record].eventStartDate.split(",")[2];
        var multipleLocation = data[record].eventCountry.split(",");
        if(multipleLocation.length>1) {
            multipleLocation = "Multiple Locations";
        }
        else {
			multipleLocation = data[record].eventCountry;
        }
        html_to_append += '<div class="jobcard">'
        +'<div class="cmp-jobcard">'
        +'<a href="'+eventUrl+'" '
        +'class="cmp-jobcard__link"' 
        +'data-analytics-module="Upcoming Events | '+data[record].eventTitle+' | position '+(record+1)+' of 4 "'
        +'data-analytics-link="STUDENTS &amp; GRADUATES | '+data[record].eventTitle+' | '+data[record].eventFormat+'" '
        +'data-analytics-job-card="S&amp;G | '+data[record].eventTitle+' | '+multipleLocation+' | '+data[record].businessUnit+' ">'
        +'<div class="cmp-jobcard__content">'
        +'<div class="cmp-jobcard__eyebrow">STUDENTS & GRADUATES</div>'
        +'<div class="cmp-jobcard__title">'+data[record].eventTitle+'</div>'
        +'<div class="cmp-jobcard__role">'+data[record].businessUnit+'</div>'
        +'<div class="cmp-jobcard__location">'+data[record].eventFormat+'</div>'
        +'<div class="cmp-jobcard__separator purple"></div><div class="cmp-jobcard__role">'+dateFormat+'</div>'
        +'<div class="cmp-jobcard__location">'+multipleLocation+'</div>'
        +'</div>'
        +'</a>'
        +'</div>'
        +'</div>'
    }

    $('.upcoming-events .endlessgrid-content').after('<div class="event-cards"></div>')
    $(".upcoming-events .event-cards").html(html_to_append);

	}
    else {
		$(".upcoming-events").hide();
    }
}
$(document).ready(function () {
    let eventendlessgridComp = $('.events-endlessgrid .cmp-events-endlessgrid');
    if(eventendlessgridComp !== undefined && eventendlessgridComp.length >0){
        let endlessEvents;
        let careerUrl = '';

        if (MSCOM.pageData.isLocal || MSCOM.pageData.isAuthor) {
            endlessEvents = "http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/eventendlessgrid.json";
        }else {
            endlessEvents = MSCOM.pageData.currentDomain + '/web/career_services/webapp/service/careerservice/eventendlessgrid.json';
        }

        $.ajax({
            url: endlessEvents,
            method: "GET",
            async: false,
            contentType: 'application/json',
            dataType: "json",
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                endlessEventsGrid(data.resultSet.sg);
            },
            error: function (data) {
                console.log("Error" + data);
            }
        });


        function endlessEventsGrid(data) {
            if (data != null && data.row.length >= 4) {
                let html_to_append = "";
                let getCompTitle = $($(".events-endlessgrid .cmp-events-endlessgrid").parents()[3]).find(".cmp-title__text").text();
                let getOppoList = $(".events-endlessgrid .cmp-events-endlessgrid").attr("data-opportunity");
                let oppoItem = getOppoList == "sg" ? "S&G" : "EP";

                // setTimeout(function() {
                let updatedAttributeValue = "";
                let getAnalticLink = $($(".events-endlessgrid .cmp-events-endlessgrid").parents()[4]).find(".link--learnmore").attr("data-analytics-link");
                if(getAnalticLink)
                    updatedAttributeValue = getAnalticLink.replace("|", "| S&G |");
                $($(".events-endlessgrid .cmp-events-endlessgrid").parents()[4]).find(".link--learnmore").attr("data-analytics-link", updatedAttributeValue);
                // },1000);


                for (let count = 0; count < 4; count++) {
                    if (MSCOM.pageData.isLocal || MSCOM.pageData.isAuthor) {
                        careerUrl = MSCOM.pageData.currentDomain + '/content/msdotcom/en/careers/students-graduates/events.' + data.row[count].id + '.html?wcmmode=disabled';
                    } else {
                        careerUrl = MSCOM.pageData.currentDomain + '/careers/students-graduates/events/' + data.row[count].id;
                    }
                    var dateFormat = data.row[count].eventStartDate.split(",")[1] + ", " + data.row[count].eventStartDate.split(",")[2];
                    var multipleLocations = data.row[count].location.split(",");
                    if (multipleLocations.length > 1) {
                        multipleLocations = "Multiple Locations";
                    }
                    else {
                        multipleLocations = data.row[count].location;
                    }
                    html_to_append += '<div class="jobcard">'
                        + '<div class="cmp-jobcard">'
                        + '<a href="' + careerUrl + '" '
                        + 'class="cmp-jobcard__link"'
                        + 'data-analytics-module="Compact Event Card | ' + data.row[count].title + ' | position ' + (count + 1) + ' of 4 "'
                        + 'data-analytics-link="' + getCompTitle + ' | ' + oppoItem + ' | ' + data.row[count].title + '" '
                        + 'data-analytics-event-card="' + getCompTitle + ' | ' + oppoItem + ' | ' + data.row[count].title + ' | ' + multipleLocations + ' | ' + data.row[count].eventStartDate + '">'
                        + '<div class="cmp-jobcard__content">'
                        + '<div class="cmp-jobcard__eyebrow">STUDENTS & GRADUATES</div>'
                        + '<div class="cmp-jobcard__title">' + data.row[count].title + '</div>'
                        + '<div class="cmp-jobcard__separator purple"></div><div class="cmp-jobcard__role">' + dateFormat + '</div>'
                        + '<div class="cmp-jobcard__location">' + multipleLocations + '</div>'
                        + '</div>'
                        + '</a>'
                        + '</div>'
                        + '</div>'
                }

                $('.events-endlessgrid .cmp-events-endlessgrid').html(html_to_append);
            }
            else {
                $($(".events-endlessgrid .cmp-events-endlessgrid").parents()[4]).hide();
            }
        }
    }
});

(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";

        /* Updated with Anayltics tag */
        let getWMTitle = $(".wealth-management-hero .heroComponent__header .title").text();
        $(".wealth-management-hero .heroComponent__header .description").find('p a').each(function(index){
            let wm_analytic_link_tag = getWMTitle + ' | In-line Body Text Link | '+ $(this).text() ; 
            $(this).attr('data-analytics-link', wm_analytic_link_tag);
        });


        /* Service Component Updated with Anayltics tag */
            let getServiceTitle = $(".wm-service--section .cmp-title .cmp-title__text").text();
            let childLength = $(".wm-service--section .wm-service--container").children().length;

            $(".wm-service--section .wm-service--container").find('.wm-columns').each(function(index){
                let wm_analytic_link_tag = getServiceTitle + ' | Conversion Module | '+ $(this).find('.wm-service--ctaLink a').text() ; 
                let wm_analytic_module = 'Conversion Module | '+ $(this).find('.wm-service--ctaLink a').text() + ' | Position '+(index+1)+' of '+childLength; 
                $(this).find('.wm-service--ctaLink a').attr('data-analytics-link', wm_analytic_link_tag);
                $(this).find('.wm-service--ctaLink a').attr('data-analytics-module', wm_analytic_module);
            });
    
            $(".wm-service--section .wm-service--container").find('.wm-columns').each(function(index){
                let wm_analytic_link_tag = getServiceTitle + ' | Conversion Module | '+ $(this).find('.wm-service--serviceCta a').text() ; 
                let wm_analytic_module = 'Conversion Module | '+ $(this).find('.wm-service--serviceCta a').text() + ' | Position '+(index+1)+' of '+childLength; 
                $(this).find('.wm-service--serviceCta a').attr('data-analytics-link', wm_analytic_link_tag);
                $(this).find('.wm-service--serviceCta a').attr('data-analytics-module', wm_analytic_module);
            });


        var videoPlayed = true;
    	$('#herocomponent_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.heroComponentPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Play");
                videoPlayed = true;
            } else {
                videojs.players.heroComponentPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Pause");
                videoPlayed = false;
            }
		});

        var heroComponentVideoId = $(".herocomponent_video").attr("data-video-id");

        if(!(heroComponentVideoId == null || heroComponentVideoId == '' || heroComponentVideoId == undefined)) {
            getVideoSchema(heroComponentVideoId,".heroComponent__video_",".herocomponent_transcript_");
        }

		if($('.composite-container').find('.heroComponent').length !== 0) {
            $('.heroComponent').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
		/* Color bar default styling */
        if( $('.heroComponent').find('.herocomponent_image').length !== 0 || $('.heroComponent').find('.herocomponent_video').length !== 0 ) {
            $('.heroComponent').css('border-left', '0px');
        } 
    });
})(jQuery, jQuery(document));


$(document).ready(function() {

    const btn = document.querySelector('#btn');        
           const radioButtons = document.querySelectorAll('input[name="language"]');
           radioButtons.checked = true;
		   
   $('#contextualSurveySubmit').click(function() {

           contextual_submit_survey();
       });	   

   $('#btn').click(function() {

           radiobuttonclick(btn,radioButtons);
       });
	   
   $('#horizontalbtn').click(function() {

           radiohorizontalbtn(btn,radioButtons);
       });
	   
	   
});


function radiobuttonclick(btn,radioButtons) {
                 let selectedText;
               for (const radioButton of radioButtons) {
                   if (radioButton.checked) {
                       selectedText = radioButton.id;
                       var selectedTextlink=selectedText+'.html';
                         window.open(selectedTextlink, '_blank');
                       break;
                   }
               }
               
    }

function radiohorizontalbtn(btn,radioButtons) {
                let selectedText;
               for (const radioButton of radioButtons) {
                   if (radioButton.checked) {
                       selectedText = radioButton.id;
                       var selectedTextlink=selectedText+'.html';
                         window.open(selectedTextlink, '_blank');
                       break;
                   }
               }
               
    }	
	
	
contextual_submit_survey = function() { 
     var clienturl=document.querySelector('#client_url').value;
       var clientid=document.querySelector('#client_id').value;
       var externalkey=document.querySelector('#external_key').value;
       var successurl=document.querySelector('#success_url').value;
       var errorurl=document.querySelector('#error_url').value;
         var IdeasInterests = $('input[name="IdeasInterests"]:checked').map(function () {
           return this.value;
           }).get().join(", ");
           var DescribeYourself = $('input[name="DescribeYourself"]:checked').map(function () {
           return this.value;
           }).get().join(", ");
           
       $(".contextualcta--checkbox-item").hide();
       $(".thankyou-wrapper").show();
        $(".survey-msg-wrapper").show();

            $.ajax({
           url: clienturl,
           type: 'post',
           data: "_clientID=" + clientid +
               "&_deExternalKey=" + externalkey +
               "&_action=" + "add" +
               "&_returnXML=" + "0" +
               "&_successURL=" + successurl +
               "&_errorURL=" + errorurl +
               "&IdeasInterests=" + encodeURIComponent(IdeasInterests)+
               "&DescribeYourself=" + encodeURIComponent(DescribeYourself),
           success: function(data) {

           }
       });
   };
/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

/**
 * Element.matches()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Element.closest()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        "use strict";
        var el = this;
        if (!document.documentElement.contains(el)) {
            return null;
        }
        do {
            if (el.matches(s)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
/* global
    CQ
 */
(function() {
    "use strict";

    var dataLayerEnabled;
    var dataLayer;

    var NS = "cmp";
    var IS = "tabs";

    var keyCodes = {
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        active: {
            tab: "cmp-tabs__tab--active",
            tabpanel: "cmp-tabs__tabpanel--active"
        }
    };

    /**
     * Tabs Configuration
     *
     * @typedef {Object} TabsConfig Represents a Tabs configuration
     * @property {HTMLElement} element The HTMLElement representing the Tabs
     * @property {Object} options The Tabs options
     */

    /**
     * Tabs
     *
     * @class Tabs
     * @classdesc An interactive Tabs component for navigating a list of tabs
     * @param {TabsConfig} config The Tabs configuration
     */
    function Tabs(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Tabs
         *
         * @private
         * @param {TabsConfig} config The Tabs configuration
         */
        function init(config) {
            that._config = config;

            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            cacheElements(config.element);
            that._active = getActiveIndex(that._elements["tab"]);

            if (that._elements.tabpanel) {
                refreshActive();
                bindEvents();
            }

            // Show the tab based on deep-link-id if it matches with any existing tab item id
            var deepLinkItemIdx = CQ.CoreComponents.container.utils.getDeepLinkItemIdx(that, "tab");
            if (deepLinkItemIdx && deepLinkItemIdx !== -1) {
                var deepLinkItem = that._elements["tab"][deepLinkItemIdx];
                if (deepLinkItem && that._elements["tab"][that._active].id !== deepLinkItem.id) {
                    navigateAndFocusTab(deepLinkItemIdx);
                }
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Tabs component
                 * - if so, route the "navigate" operation to enact a navigation of the Tabs based on index data
                 */
                CQ.CoreComponents.MESSAGE_CHANNEL = CQ.CoreComponents.MESSAGE_CHANNEL || new window.Granite.author.MessageChannel("cqauthor", window);
                CQ.CoreComponents.MESSAGE_CHANNEL.subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-tabs" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Returns the index of the active tab, if no tab is active returns 0
         *
         * @param {Array} tabs Tab elements
         * @returns {Number} Index of the active tab, 0 if none is active
         */
        function getActiveIndex(tabs) {
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].classList.contains(selectors.active.tab)) {
                        return i;
                    }
                }
            }
            return 0;
        }

        /**
         * Caches the Tabs elements as defined via the {@code data-tabs-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Tabs wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                if (hook.closest("." + NS + "-" + IS) === that._elements.self) { // only process own tab elements
                    var capitalized = IS;
                    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                    var key = hook.dataset[NS + "Hook" + capitalized];
                    if (that._elements[key]) {
                        if (!Array.isArray(that._elements[key])) {
                            var tmp = that._elements[key];
                            that._elements[key] = [tmp];
                        }
                        that._elements[key].push(hook);
                    } else {
                        that._elements[key] = hook;
                    }
                }
            }
        }

        /**
         * Binds Tabs event handling
         *
         * @private
         */
        function bindEvents() {
            var tabs = that._elements["tab"];
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    (function(index) {
                        tabs[i].addEventListener("click", function(event) {
                            navigateAndFocusTab(index);
                        });
                        tabs[i].addEventListener("keydown", function(event) {
                            onKeyDown(event);
                        });
                    })(i);
                }
            }
        }

        /**
         * Handles tab keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["tab"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusTab(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusTab(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusTab(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusTab(lastIndex);
                    break;
                default:
                    return;
            }
        }

        /**
         * Refreshes the tab markup based on the current {@code Tabs#_active} index
         *
         * @private
         */
        function refreshActive() {
            var tabpanels = that._elements["tabpanel"];
            var tabs = that._elements["tab"];

            if (tabpanels) {
                if (Array.isArray(tabpanels)) {
                    for (var i = 0; i < tabpanels.length; i++) {
                        if (i === parseInt(that._active)) {
                            tabpanels[i].classList.add(selectors.active.tabpanel);
                            tabpanels[i].removeAttribute("aria-hidden");
                            tabs[i].classList.add(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", true);
                            tabs[i].setAttribute("tabindex", "0");
                        } else {
                            tabpanels[i].classList.remove(selectors.active.tabpanel);
                            tabpanels[i].setAttribute("aria-hidden", true);
                            tabs[i].classList.remove(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", false);
                            tabs[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one tab
                    tabpanels.classList.add(selectors.active.tabpanel);
                    tabs.classList.add(selectors.active.tab);
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Navigates to the tab at the provided index
         *
         * @private
         * @param {Number} index The index of the tab to navigate to
         */
        function navigate(index) {
            that._active = index;
            refreshActive();
        }

        /**
         * Navigates to the item at the provided index and ensures the active tab gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusTab(index) {
            var exActive = that._active;
            navigate(index);
            focusWithoutScroll(that._elements["tab"][index]);

            if (dataLayerEnabled) {

                var activeItem = getDataLayerId(that._elements.tabpanel[index]);
                var exActiveItem = getDataLayerId(that._elements.tabpanel[exActive]);

                dataLayer.push({
                    event: "cmp:show",
                    eventInfo: {
                        path: "component." + activeItem
                    }
                });

                dataLayer.push({
                    event: "cmp:hide",
                    eventInfo: {
                        path: "component." + exActiveItem
                    }
                });

                var tabsId = that._elements.self.id;
                var uploadPayload = { component: {} };
                uploadPayload.component[tabsId] = { shownItems: [activeItem] };

                var removePayload = { component: {} };
                removePayload.component[tabsId] = { shownItems: undefined };

                dataLayer.push(removePayload);
                dataLayer.push(uploadPayload);
            }
        }
    }

    /**
     * Scrolls the browser when the URI fragment is changed to the item of the container Tab component that corresponds to the deep link in the URI fragment,
       and displays its content.
     */
    function onHashChange() {
        if (location.hash && location.hash !== "#") {
            var anchorLocation = decodeURIComponent(location.hash);
            var anchorElement = document.querySelector(anchorLocation);
            if (anchorElement && anchorElement.classList.contains("cmp-tabs__tab") && !anchorElement.classList.contains("cmp-tabs__tab--active")) {
                anchorElement.click();
            }
        }
    }

    /**
     * Reads options data from the Tabs wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Tabs element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Parses the dataLayer string and returns the ID
     *
     * @private
     * @param {HTMLElement} item the accordion item
     * @returns {String} dataLayerId or undefined
     */
    function getDataLayerId(item) {
        if (item && item.dataset.cmpDataLayer) {
            return Object.keys(JSON.parse(item.dataset.cmpDataLayer))[0];
        } else {
            return item.id;
        }
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Tabs components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        dataLayerEnabled = document.body.hasAttribute("data-cmp-data-layer-enabled");
        dataLayer = (dataLayerEnabled) ? window.adobeDataLayer = window.adobeDataLayer || [] : undefined;

        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Tabs({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Tabs({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    window.addEventListener("load", window.CQ.CoreComponents.container.utils.scrollToAnchor, false);
    window.addEventListener("hashchange", onHashChange, false);

}());

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var dataLayerEnabled;
    var dataLayer;

    var NS = "cmp";
    var IS = "carousel";

    var keyCodes = {
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * Determines whether the Carousel will automatically transition between slides
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autoplay": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Duration (in milliseconds) before automatically transitioning to the next slide
         *
         * @memberof Carousel
         * @type {Number}
         * @default 5000
         */
        "delay": {
            "default": 5000,
            "transform": function(value) {
                value = parseFloat(value);
                return !isNaN(value) ? value : null;
            }
        },
        /**
         * Determines whether automatic pause on hovering the carousel is disabled
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autopauseDisabled": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Carousel Configuration
     *
     * @typedef {Object} CarouselConfig Represents a Carousel configuration
     * @property {HTMLElement} element The HTMLElement representing the Carousel
     * @property {Object} options The Carousel options
     */

    /**
     * Carousel
     *
     * @class Carousel
     * @classdesc An interactive Carousel component for navigating a list of generic items
     * @param {CarouselConfig} config The Carousel configuration
     */
    function Carousel(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Carousel
         *
         * @private
         * @param {CarouselConfig} config The Carousel configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            that._active = 0;
            that._paused = false;

            if (that._elements.item) {
                refreshActive();
                bindEvents();
                resetAutoplayInterval();
                refreshPlayPauseActions();
            }

            // TODO: This section is only relevant in edit mode and should move to the editor clientLib
            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Carousel component
                 * - if so, route the "navigate" operation to enact a navigation of the Carousel based on index data
                 */
                window.CQ = window.CQ || {};
                window.CQ.CoreComponents = window.CQ.CoreComponents || {};
                window.CQ.CoreComponents.MESSAGE_CHANNEL = window.CQ.CoreComponents.MESSAGE_CHANNEL || new window.Granite.author.MessageChannel("cqauthor", window);
                window.CQ.CoreComponents.MESSAGE_CHANNEL.subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-carousel" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Caches the Carousel elements as defined via the {@code data-carousel-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Carousel wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                if (that._elements[key]) {
                    if (!Array.isArray(that._elements[key])) {
                        var tmp = that._elements[key];
                        that._elements[key] = [tmp];
                    }
                    that._elements[key].push(hook);
                } else {
                    that._elements[key] = hook;
                }
            }
        }

        /**
         * Sets up properties for the Carousel based on the passed options.
         *
         * @private
         * @param {Object} options The Carousel options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Carousel event handling
         *
         * @private
         */
        function bindEvents() {
            if (that._elements["previous"]) {
                that._elements["previous"].addEventListener("click", function() {
                    var index = getPreviousIndex();
                    navigate(index);
                    if (dataLayerEnabled) {
                        dataLayer.push({
                            event: "cmp:show",
                            eventInfo: {
                                path: "component." + getDataLayerId(that._elements.item[index])
                            }
                        });
                    }
                });
            }

            if (that._elements["next"]) {
                that._elements["next"].addEventListener("click", function() {
                    var index = getNextIndex();
                    navigate(index);
                    if (dataLayerEnabled) {
                        dataLayer.push({
                            event: "cmp:show",
                            eventInfo: {
                                path: "component." + getDataLayerId(that._elements.item[index])
                            }
                        });
                    }
                });
            }

            var indicators = that._elements["indicator"];
            if (indicators) {
                for (var i = 0; i < indicators.length; i++) {
                    (function(index) {
                        indicators[i].addEventListener("click", function(event) {
                            navigateAndFocusIndicator(index);
                        });
                    })(i);
                }
            }

            if (that._elements["pause"]) {
                if (that._properties.autoplay) {
                    that._elements["pause"].addEventListener("click", onPauseClick);
                }
            }

            if (that._elements["play"]) {
                if (that._properties.autoplay) {
                    that._elements["play"].addEventListener("click", onPlayClick);
                }
            }

            that._elements.self.addEventListener("keydown", onKeyDown);

            if (!that._properties.autopauseDisabled) {
                that._elements.self.addEventListener("mouseenter", onMouseEnter);
                that._elements.self.addEventListener("mouseleave", onMouseLeave);
            }

            // for accessibility we pause animation when a element get focused
            var items = that._elements["item"];
            if (items) {
                for (var j = 0; j < items.length; j++) {
                    items[j].addEventListener("focusin", onMouseEnter);
                    items[j].addEventListener("focusout", onMouseLeave);
                }
            }
        }

        /**
         * Handles carousel keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["indicator"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusIndicator(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusIndicator(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusIndicator(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusIndicator(lastIndex);
                    break;
                case keyCodes.SPACE:
                    if (that._properties.autoplay && (event.target !== that._elements["previous"] && event.target !== that._elements["next"])) {
                        event.preventDefault();
                        if (!that._paused) {
                            pause();
                        } else {
                            play();
                        }
                    }
                    if (event.target === that._elements["pause"]) {
                        that._elements["play"].focus();
                    }
                    if (event.target === that._elements["play"]) {
                        that._elements["pause"].focus();
                    }
                    break;
                default:
                    return;
            }
        }

        /**
         * Handles carousel mouseenter events
         *
         * @private
         * @param {Object} event The mouseenter event
         */
        function onMouseEnter(event) {
            clearAutoplayInterval();
        }

        /**
         * Handles carousel mouseleave events
         *
         * @private
         * @param {Object} event The mouseleave event
         */
        function onMouseLeave(event) {
            resetAutoplayInterval();
        }

        /**
         * Handles pause element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPauseClick(event) {
            pause();
            that._elements["play"].focus();
        }

        /**
         * Handles play element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPlayClick() {
            play();
            that._elements["pause"].focus();
        }

        /**
         * Pauses the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function pause() {
            that._paused = true;
            clearAutoplayInterval();
            refreshPlayPauseActions();
        }

        /**
         * Enables the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function play() {
            that._paused = false;

            // If the Carousel is hovered, don't begin auto transitioning until the next mouse leave event
            var hovered = false;
            if (that._elements.self.parentElement) {
                hovered = that._elements.self.parentElement.querySelector(":hover") === that._elements.self;
            }
            if (that._properties.autopauseDisabled || !hovered) {
                resetAutoplayInterval();
            }

            refreshPlayPauseActions();
        }

        /**
         * Refreshes the play/pause action markup based on the {@code Carousel#_paused} state
         *
         * @private
         */
        function refreshPlayPauseActions() {
            setActionDisabled(that._elements["pause"], that._paused);
            setActionDisabled(that._elements["play"], !that._paused);
        }

        /**
         * Refreshes the item markup based on the current {@code Carousel#_active} index
         *
         * @private
         */
        function refreshActive() {
            var items = that._elements["item"];
            var indicators = that._elements["indicator"];

            if (items) {
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        if (i === parseInt(that._active)) {
                            items[i].classList.add("cmp-carousel__item--active");
                            items[i].removeAttribute("aria-hidden");
                            indicators[i].classList.add("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", true);
                            indicators[i].setAttribute("tabindex", "0");
                        } else {
                            items[i].classList.remove("cmp-carousel__item--active");
                            items[i].setAttribute("aria-hidden", true);
                            indicators[i].classList.remove("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", false);
                            indicators[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one item
                    items.classList.add("cmp-carousel__item--active");
                    indicators.classList.add("cmp-carousel__indicator--active");
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Retrieves the next active index, with looping
         *
         * @private
         * @returns {Number} Index of the next carousel item
         */
        function getNextIndex() {
            return that._active === (that._elements["item"].length - 1) ? 0 : that._active + 1;
        }

        /**
         * Retrieves the previous active index, with looping
         *
         * @private
         * @returns {Number} Index of the previous carousel item
         */
        function getPreviousIndex() {
            return that._active === 0 ? (that._elements["item"].length - 1) : that._active - 1;
        }

        /**
         * Navigates to the item at the provided index
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigate(index) {
            if (index < 0 || index > (that._elements["item"].length - 1)) {
                return;
            }

            that._active = index;
            refreshActive();

            if (dataLayerEnabled) {
                var carouselId = that._elements.self.id;
                var activeItem = getDataLayerId(that._elements.item[index]);
                var updatePayload = { component: {} };
                updatePayload.component[carouselId] = { shownItems: [activeItem] };

                var removePayload = { component: {} };
                removePayload.component[carouselId] = { shownItems: undefined };

                dataLayer.push(removePayload);
                dataLayer.push(updatePayload);
            }

            // reset the autoplay transition interval following navigation, if not already hovering the carousel
            if (that._elements.self.parentElement) {
                if (that._elements.self.parentElement.querySelector(":hover") !== that._elements.self) {
                    resetAutoplayInterval();
                }
            }
        }

        /**
         * Navigates to the item at the provided index and ensures the active indicator gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusIndicator(index) {
            navigate(index);
            focusWithoutScroll(that._elements["indicator"][index]);

            if (dataLayerEnabled) {
                dataLayer.push({
                    event: "cmp:show",
                    eventInfo: {
                        path: "component." + getDataLayerId(that._elements.item[index])
                    }
                });
            }
        }

        /**
         * Starts/resets automatic slide transition interval
         *
         * @private
         */
        function resetAutoplayInterval() {
            if (that._paused || !that._properties.autoplay) {
                return;
            }
            clearAutoplayInterval();
            that._autoplayIntervalId = window.setInterval(function() {
                if (document.visibilityState && document.hidden) {
                    return;
                }
                var indicators = that._elements["indicators"];
                if (indicators !== document.activeElement && indicators.contains(document.activeElement)) {
                    // if an indicator has focus, ensure we switch focus following navigation
                    navigateAndFocusIndicator(getNextIndex());
                } else {
                    navigate(getNextIndex());
                }
            }, that._properties.delay);
        }

        /**
         * Clears/pauses automatic slide transition interval
         *
         * @private
         */
        function clearAutoplayInterval() {
            window.clearInterval(that._autoplayIntervalId);
            that._autoplayIntervalId = null;
        }

        /**
         * Sets the disabled state for an action and toggles the appropriate CSS classes
         *
         * @private
         * @param {HTMLElement} action Action to disable
         * @param {Boolean} [disable] {@code true} to disable, {@code false} to enable
         */
        function setActionDisabled(action, disable) {
            if (!action) {
                return;
            }
            if (disable !== false) {
                action.disabled = true;
                action.classList.add("cmp-carousel__action--disabled");
            } else {
                action.disabled = false;
                action.classList.remove("cmp-carousel__action--disabled");
            }
        }
    }

    /**
     * Reads options data from the Carousel wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Carousel element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Parses the dataLayer string and returns the ID
     *
     * @private
     * @param {HTMLElement} item the accordion item
     * @returns {String} dataLayerId or undefined
     */
    function getDataLayerId(item) {
        if (item && item.dataset.cmpDataLayer) {
            return Object.keys(JSON.parse(item.dataset.cmpDataLayer))[0];
        } else {
            return item.id;
        }
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Carousel components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        dataLayerEnabled = document.body.hasAttribute("data-cmp-data-layer-enabled");
        dataLayer = (dataLayerEnabled) ? window.adobeDataLayer = window.adobeDataLayer || [] : undefined;

        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Carousel({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Carousel({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());

/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
if (window.Element && !Element.prototype.closest) {
    // eslint valid-jsdoc: "off"
    Element.prototype.closest =
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var el      = this;
            var i;
            do {
                i = matches.length;
                while (--i >= 0 && matches.item(i) !== el) {
                    // continue
                }
            } while ((i < 0) && (el = el.parentElement));
            return el;
        };
}

if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i       = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                // continue
            }
            return i > -1;
        };
}

if (!Object.assign) {
    Object.assign = function(target, varArgs) { // .length of function is 2
        "use strict";
        if (target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

(function(arr) {
    "use strict";
    arr.forEach(function(item) {
        if (item.hasOwnProperty("remove")) {
            return;
        }
        Object.defineProperty(item, "remove", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "image";

    var EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    var LAZY_THRESHOLD_DEFAULT = 0;
    var SRC_URI_TEMPLATE_WIDTH_VAR = "{.width}";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        image: '[data-cmp-hook-image="image"]',
        map: '[data-cmp-hook-image="map"]',
        area: '[data-cmp-hook-image="area"]'
    };

    var lazyLoader = {
        "cssClass": "cmp-image__image--is-loading",
        "style": {
            "height": 0,
            "padding-bottom": "" // will be replaced with % ratio
        }
    };

    var properties = {
        /**
         * An array of alternative image widths (in pixels).
         * Used to replace a {.width} variable in the src property with an optimal width if a URI template is provided.
         *
         * @memberof Image
         * @type {Number[]}
         * @default []
         */
        "widths": {
            "default": [],
            "transform": function(value) {
                var widths = [];
                value.split(",").forEach(function(item) {
                    item = parseFloat(item);
                    if (!isNaN(item)) {
                        widths.push(item);
                    }
                });
                return widths;
            }
        },
        /**
         * Indicates whether the image should be rendered lazily.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "lazy": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Indicates image is DynamicMedia image.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "dmimage": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * The lazy threshold.
         * This is the number of pixels, in advance of becoming visible, when an lazy-loading image should begin
         * to load.
         *
         * @memberof Image
         * @type {Number}
         * @default 0
         */
        "lazythreshold": {
            "default": 0,
            "transform": function(value) {
                var val =  parseInt(value);
                if (isNaN(val)) {
                    return LAZY_THRESHOLD_DEFAULT;
                }
                return val;
            }
        },
        /**
         * The image source.
         *
         * Can be a simple image source, or a URI template representation that
         * can be variable expanded - useful for building an image configuration with an alternative width.
         * e.g. '/path/image.coreimg{.width}.jpeg/1506620954214.jpeg'
         *
         * @memberof Image
         * @type {String}
         */
        "src": {
            "transform": function(value) {
                return decodeURIComponent(value);
            }
        }
    };

    var devicePixelRatio = window.devicePixelRatio || 1;

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function Image(config) {
        var that = this;

        var smartCrops = {};

        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);
            // check image is DM asset; if true try to make req=set
            if (config.options.src && config.options.hasOwnProperty("dmimage") && (config.options["smartcroprendition"] === "SmartCrop:Auto")) {
                var request = new XMLHttpRequest();
                var url = decodeURIComponent(config.options.src).split(SRC_URI_TEMPLATE_WIDTH_VAR)[0] + "?req=set,json";


                request.open("GET", url, false);
                request.onload = function() {
                    if (request.status >= 200 && request.status < 400) {
                        // success status
                        var responseText = request.responseText;
                        var rePayload = new RegExp(/^(?:\/\*jsonp\*\/)?\s*([^()]+)\(([\s\S]+),\s*"[0-9]*"\);?$/gmi);
                        var rePayloadJSON = new RegExp(/^{[\s\S]*}$/gmi);
                        var resPayload = rePayload.exec(responseText);
                        var payload;
                        if (resPayload) {
                            var payloadStr = resPayload[2];
                            if (rePayloadJSON.test(payloadStr)) {
                                payload = JSON.parse(payloadStr);
                            }

                        }
                        // check "relation" - only in case of smartcrop preset
                        if (payload && payload.set.relation && payload.set.relation.length > 0) {
                            for (var i = 0; i < payload.set.relation.length; i++) {
                                smartCrops[parseInt(payload.set.relation[i].userdata.SmartCropWidth)] =
                                    ":" + payload.set.relation[i].userdata.SmartCropDef;
                            }
                        }
                    } else {
                        // error status
                    }
                };
                request.send();
            }

            if (!that._elements.noscript) {
                return;
            }

            that._elements.container = that._elements.link ? that._elements.link : that._elements.self;

            unwrapNoScript();

            if (that._properties.lazy) {
                addLazyLoader();
            }

            if (that._elements.map) {
                that._elements.image.addEventListener("load", onLoad);
            }

            window.addEventListener("resize", onWindowResize);
            ["focus", "click", "load", "transitionend", "animationend", "scroll"].forEach(function(name) {
                document.addEventListener(name, that.update);
            });

            that._elements.image.addEventListener("cmp-image-redraw", that.update);
            that.update();
        }

        function loadImage() {
            var hasWidths = (that._properties.widths && that._properties.widths.length > 0) || Object.keys(smartCrops).length > 0;
            var replacement;
            if (Object.keys(smartCrops).length > 0) {
                var optimalWidth = getOptimalWidth(Object.keys(smartCrops));
                replacement = smartCrops[optimalWidth];
            } else {
                replacement = hasWidths ? (that._properties.dmimage ? "" : ".") + getOptimalWidth(that._properties.widths) : "";
            }
            var url = that._properties.src.replace(SRC_URI_TEMPLATE_WIDTH_VAR, replacement);
            var imgSrcAttribute = that._elements.image.getAttribute("src");

            if (url !== imgSrcAttribute) {
                if (imgSrcAttribute === null || imgSrcAttribute === EMPTY_PIXEL) {
                    that._elements.image.setAttribute("src", url);
                } else {
                    var urlTemplateParts = that._properties.src.split(SRC_URI_TEMPLATE_WIDTH_VAR);
                    // check if image src was dynamically swapped meanwhile (e.g. by Target)
                    var isImageRefSame = imgSrcAttribute.startsWith(urlTemplateParts[0]);
                    if (isImageRefSame && urlTemplateParts.length > 1) {
                        isImageRefSame = imgSrcAttribute.endsWith(urlTemplateParts[urlTemplateParts.length - 1]);
                    }
                    if (isImageRefSame) {
                        that._elements.image.setAttribute("src", url);
                        if (!hasWidths) {
                            window.removeEventListener("scroll", that.update);
                        }
                    }
                }
            }
            if (that._lazyLoaderShowing) {
                that._elements.image.addEventListener("load", removeLazyLoader);
            }
        }

        function getOptimalWidth(widths) {
            var container = that._elements.self;
            var containerWidth = container.clientWidth;
            while (containerWidth === 0 && container.parentNode) {
                container = container.parentNode;
                containerWidth = container.clientWidth;
            }
            var optimalWidth = containerWidth * devicePixelRatio;
            var len = widths.length;
            var key = 0;

            while ((key < len - 1) && (widths[key] < optimalWidth)) {
                key++;
            }

            return widths[key].toString();
        }

        function addLazyLoader() {
            var width = that._elements.image.getAttribute("width");
            var height = that._elements.image.getAttribute("height");

            if (width && height) {
                var ratio = (height / width) * 100;
                var styles = lazyLoader.style;

                styles["padding-bottom"] = ratio + "%";

                for (var s in styles) {
                    if (styles.hasOwnProperty(s)) {
                        that._elements.image.style[s] = styles[s];
                    }
                }
            }
            that._elements.image.setAttribute("src", EMPTY_PIXEL);
            that._elements.image.classList.add(lazyLoader.cssClass);
            that._lazyLoaderShowing = true;
        }

        function unwrapNoScript() {
            var markup = decodeNoscript(that._elements.noscript.textContent.trim());
            var parser = new DOMParser();

            // temporary document avoids requesting the image before removing its src
            var temporaryDocument = parser.parseFromString(markup, "text/html");
            var imageElement = temporaryDocument.querySelector(selectors.image);
            imageElement.removeAttribute("src");
            that._elements.container.insertBefore(imageElement, that._elements.noscript);

            var mapElement = temporaryDocument.querySelector(selectors.map);
            if (mapElement) {
                that._elements.container.insertBefore(mapElement, that._elements.noscript);
            }

            that._elements.noscript.parentNode.removeChild(that._elements.noscript);
            if (that._elements.container.matches(selectors.image)) {
                that._elements.image = that._elements.container;
            } else {
                that._elements.image = that._elements.container.querySelector(selectors.image);
            }

            that._elements.map = that._elements.container.querySelector(selectors.map);
            that._elements.areas = that._elements.container.querySelectorAll(selectors.area);
        }

        function removeLazyLoader() {
            that._elements.image.classList.remove(lazyLoader.cssClass);
            for (var property in lazyLoader.style) {
                if (lazyLoader.style.hasOwnProperty(property)) {
                    that._elements.image.style[property] = "";
                }
            }
            that._elements.image.removeEventListener("load", removeLazyLoader);
            that._lazyLoaderShowing = false;
        }

        function isLazyVisible() {
            if (that._elements.container.offsetParent === null) {
                return false;
            }

            var wt = window.pageYOffset;
            var wb = wt + document.documentElement.clientHeight;
            var et = that._elements.container.getBoundingClientRect().top + wt;
            var eb = et + that._elements.container.clientHeight;

            return eb >= wt - that._properties.lazythreshold && et <= wb + that._properties.lazythreshold;
        }

        function resizeAreas() {
            if (that._elements.areas && that._elements.areas.length > 0) {
                for (var i = 0; i < that._elements.areas.length; i++) {
                    var width = that._elements.image.width;
                    var height = that._elements.image.height;

                    if (width && height) {
                        var relcoords = that._elements.areas[i].dataset.cmpRelcoords;
                        if (relcoords) {
                            var relativeCoordinates = relcoords.split(",");
                            var coordinates = new Array(relativeCoordinates.length);

                            for (var j = 0; j < coordinates.length; j++) {
                                if (j % 2 === 0) {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * width);
                                } else {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * height);
                                }
                            }

                            that._elements.areas[i].coords = coordinates;
                        }
                    }
                }
            }
        }

        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                that._elements[key] = hook;
            }
        }

        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    if (options && options[key] != null) {
                        if (property && typeof property.transform === "function") {
                            that._properties[key] = property.transform(options[key]);
                        } else {
                            that._properties[key] = options[key];
                        }
                    } else {
                        that._properties[key] = properties[key]["default"];
                    }
                }
            }
        }

        function onWindowResize() {
            that.update();
            resizeAreas();
        }

        function onLoad() {
            resizeAreas();
        }

        that.update = function() {
            if (that._properties.lazy) {
                if (isLazyVisible()) {
                    loadImage();
                }
            } else {
                loadImage();
            }
        };

        if (config && config.element) {
            init(config);
        }
    }

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Image({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Image({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    /*
        on drag & drop of the component into a parsys, noscript's content will be escaped multiple times by the editor which creates
        the DOM for editing; the HTML parser cannot be used here due to the multiple escaping
     */
    function decodeNoscript(text) {
        text = text.replace(/&(amp;)*lt;/g, "<");
        text = text.replace(/&(amp;)*gt;/g, ">");
        return text;
    }

})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "formText";
    var IS_DASH = "form-text";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * A validation message to display if there is a type mismatch between the user input and expected input.
         *
         * @type {String}
         */
        constraintMessage: {
        },
        /**
         * A validation message to display if no input is supplied, but input is expected for the field.
         *
         * @type {String}
         */
        requiredMessage: {
        }
    };

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function FormText(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._elements.input.addEventListener("invalid", this._onInvalid.bind(this));
        this._elements.input.addEventListener("input", this._onInput.bind(this));
    }

    FormText.prototype._onInvalid = function(event) {
        event.target.setCustomValidity("");
        if (event.target.validity.typeMismatch) {
            if (this._properties.constraintMessage) {
                event.target.setCustomValidity(this._properties.constraintMessage);
            }
        } else if (event.target.validity.valueMissing) {
            if (this._properties.requiredMessage) {
                event.target.setCustomValidity(this._properties.requiredMessage);
            }
        }
    };

    FormText.prototype._onInput = function(event) {
        event.target.setCustomValidity("");
    };

    FormText.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS_DASH + "]");
        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    FormText.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new FormText({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new FormText({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "formText";
    var IS_DASH = "form-text";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * A validation message to display if there is a type mismatch between the user input and expected input.
         *
         * @type {String}
         */
        constraintMessage: "",
        /**
         * A validation message to display if no input is supplied, but input is expected for the field.
         *
         * @type {String}
         */
        requiredMessage: ""
    };

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function FormText(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._elements.input.addEventListener("invalid", this._onInvalid.bind(this));
        this._elements.input.addEventListener("input", this._onInput.bind(this));
    }

    FormText.prototype._onInvalid = function(event) {
        event.target.setCustomValidity("");
        if (event.target.validity.typeMismatch) {
            if (this._properties.constraintMessage) {
                event.target.setCustomValidity(this._properties.constraintMessage);
            }
        } else if (event.target.validity.valueMissing) {
            if (this._properties.requiredMessage) {
                event.target.setCustomValidity(this._properties.requiredMessage);
            }
        }
    };

    FormText.prototype._onInput = function(event) {
        event.target.setCustomValidity("");
    };

    FormText.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS_DASH + "]");
        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    FormText.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new FormText({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new FormText({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

$(document).ready(function () {
    const articleHeader = $(".article_header_grid-container");

    if (articleHeader !== undefined && articleHeader.length > 0) {
        let totalWords = $(".cmp-body-text").text().split(" ");
        let timeToReadText = totalWords.length / 200;
        let timeInMnt = Math.round(timeToReadText);
        timeInMnt <= 1 ? (timeInMnt = 1) : (timeInMnt);
        if ($("#minute").length) {
            window.onload = function () {
                document.getElementById("minute").innerHTML = timeInMnt;
            }
        }

        const elem = document.getElementsByClassName('cmp_articleheader_page_topic');
        for (i = 0; i < elem.length; i++) {
            if (elem[i].getAttribute("href")) {
                if (elem[i].getAttribute("href").length > 1) {
                    $(".cmp_articleheader_page_topic").css("color", "#187ABA");
                }
            }
        }
    }
});

$(document).ready(function() {
    var $stats = $('.stats-carousel__container');
    var title =  $(this).find(".cmp__stats-carousel .stats__title-container .stats__title").text();

    $stats.slick({
        arrows: true,
        slidesToShow: 4,
        infinite: true,
        dots: true,
        centerMode: false,
        accessibility: false,
        responsive: [
    {
      breakpoint: 767,
      settings: {
      slidesToShow: 1,
      slidesToScroll: 1,
      centerMode:false,
      }
    }
	 ]

    });

    $(".cmp__stats-carousel .slick-prev.slick-arrow").attr("data-analytics-button", title+" | Carousel Left");
    $(".cmp__stats-carousel .slick-next.slick-arrow").attr("data-analytics-button", title+" | Carousel Right");

});
/*
 * Listicle Analytics Implementation
 */
(function ($, $document) {

    var LISTICLE_LANDING_DESCRIPTION_ANCHOR_SELECTOR = ".cmp-listicle__landingDescription a",
        LISTICLE_LANDING_TITLE_SELECTOR = ".cmp-listicle__landingTitle",
        LISTICLE_INLINE_TITLE_SELECTOR = ".cmp-listicle__inlineTitle",
        ITEM_TEXT_ANCHOR_SELECTOR = "div[class^='cmp-listicle__card_itemText_'] a",
        ITEM_SUB_TITLE_SELECTOR = ".cmp-listicle__card_itemSubtitle",
        ITEM_NUMBER_SELECTOR = ".cmp-listicle__card_itemNumber",
        LISTICLE_CARD_CLASS = "cmp-listicle__card",
        $parent, landingTitle, sectionTitle, cardTitle, cardNumber, descAnchorAnalyticsLinkTxt, linkText;

    /* Trigger on page load */
    $(document).ready(function () {
        $(LISTICLE_LANDING_DESCRIPTION_ANCHOR_SELECTOR).each(function(index) {
			landingTitle = $(LISTICLE_LANDING_TITLE_SELECTOR).text();
            linkText = $(this).text();
            if(!landingTitle || !linkText) return;
			descAnchorAnalyticsLinkTxt = landingTitle.trim() + " | Teaser Text | " + $(this).text().trim();
			$(this).attr("data-analytics-link", descAnchorAnalyticsLinkTxt);
        });

		$(ITEM_TEXT_ANCHOR_SELECTOR).each(function(index) {
            landingTitle = $(LISTICLE_LANDING_TITLE_SELECTOR).text();
            sectionTitle = landingTitle ? landingTitle : $(LISTICLE_INLINE_TITLE_SELECTOR).text();
            linkText = $(this).text();
            if(!sectionTitle || !linkText) return;
			$parent = $(findAncestor(this, LISTICLE_CARD_CLASS));
            cardTitle = $parent.find(ITEM_SUB_TITLE_SELECTOR).text();
            cardNumber = $parent.find(ITEM_NUMBER_SELECTOR).text();
            totalCards = $("." + LISTICLE_CARD_CLASS).length;
            $(this).attr("data-analytics-link", sectionTitle.trim() + " | Listicle | " + cardNumber.trim() + " " + cardTitle.trim() + " | " + linkText.trim());
			$(this).attr("data-analytics-list", "Listicle | " + cardTitle.trim() + " | " + "Position " + parseInt(cardNumber) + " of " + totalCards);
        });
    });

    /**
     * Finds out the ancestor of the current element based on the class name
     * @param {*Current element} el 
     * @param {*Ancestor className} cls 
     */
    function findAncestor(el, cls) {
        while ((el = el.parentElement) && !el.classList.contains(cls));
        return el;
    }

})(jQuery, jQuery(document));
$(document).ready(function() {
    var myPlayers = [];
	var myPlayer;
	var activeVideoID;

    $(".cmp__one-up .one-up__video").each(function(index) {
        myPlayers.push($(this).attr('data-videoId'));
        getOneUpVideoDuration(getVideoSchema($(this).attr('data-videoId'),".one-up__video_",".one-up__video_transcript_"),$(this));
    });

    $(".one-up__video").click(function() {
        var currentObj = $(this);
        for(var i=0; i<myPlayers.length; i++) {
            var name = myPlayers[i];
            if(name == $(this).attr('data-videoId')) {
              $('.cmp__one-up .lightBox' + name +',.cmp__one-up .lightboxInner' + name).css({"display" : "block"});
              $('.cmp__one-up .lightBox' + name +',.cmp__one-up .lightboxInner' + name).focus();
              $('.cmp__one-up .playerClose').focus();
                videojs.getPlayer(name).ready(function() {
                    myPlayer = this;
                    myPlayer.on('loadstart',function() {
                    });
                    myPlayer.play();
                });
               activeVideoID = $(this).attr("data-videoId");
               break;
            }
        }

        $(".cmp__one-up .vjs-fullscreen-control,.cmp__one-up .lightBox").on('keydown', function(e) {
			var keyCode = e.keyCode || e.which;
			if (keyCode == 9 && (!e.shiftKey)) {
				e.preventDefault();
				$('.cmp__one-up .playerClose').focus();
			}
        });
        $(".cmp__one-up .playerClose,.cmp__one-up .lightBox").on('keydown', function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9 && e.shiftKey) {
                e.preventDefault();
                $('.cmp__one-up .vjs-fullscreen-control').focus();
            }
        });
        $(".cmp__one-up .playerClose,.cmp__one-up .lightBox").on("click", function(e) {
            $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
            myPlayer.pause();
            currentObj.focus();
        });
        $(".cmp__one-up .lightboxInner" + name).on("keydown", function(e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                e.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp__one-up .playerClose").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });
        $(".cmp__one-up .vjs-play-control,.cmp__one-up .vjs-mute-control,.cmp__one-up .vjs-volume-bar,.cmp__one-up .vjs-progress-holder,.cmp__one-up .vjs-share-control,.cmp__one-up .vjs-subs-caps-button,.cmp__one-up .vjs-picture-in-picture-control,.cmp__one-up .vjs-fullscreen-control").on('keydown', function(event) {
            var keyCode = event.keyCode || event.which;
            if(keyCode === 27) {
                event.preventDefault();
                $(".cmp__one-up .lightboxInner,.cmp__one-up .lightBox").css({"display" : "none"});
                myPlayer.pause();
                currentObj.focus();
            }
        });

    });
});

function getOneUpVideoDuration(videoObj,video) {

    if(videoObj.length) {
        var _duration = oneUpMillisToMinsAndSec(videoObj.length);
        if(_duration.indexOf('NaN') == -1) {
            video.find('.one-up__video__duration').text(_duration);
        }
    }
}

function oneUpMillisToMinsAndSec(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}
$(document).ready(function () {
	/* Inline social share */
    $(".insights-inlineaudio--share").on("click", function(e){
		//$(this).find(".inlineaudio-share-social ").toggle();
       e.stopPropagation();
		$(this).next().toggle();
		if($(this).next().is(':visible')){
			$(this).next().attr("aria-expanded", "true");
		}
		else{
			$(this).next().attr("aria-expanded", "false");
		}
    })

	$(document).click(function (e) {

		if ($(e.target).parents(".insightsInlineaudio-share-social ").length === 0 ) {
		 	$(".insightsInlineaudio-share-social").hide();
			$(".cmp-insights-inlineaudio--share").attr("aria-expanded", "false");
            $(".listenTo_dropdownContain").hide();
		}    

    	if ($(e.target).parents(".listenTo_dropdownContain ").length === 0) {
            $(".listenTo_dropdownContain").hide();
            $(".listenTo_dropdownContain").find(".fa").toggleClass('fa-angle-down');
            $(".listenTo_dropdownContain").find(".fa").toggleClass('fa-angle-up');
		}
        if ($(e.target).parents(".cmp-insights-inlineaudio--transcript ").length === 0) {
            $(".cmp-insights-inlineaudio--trans-container").hide();
            $(".inline-audio-viewaudTS").show();
            $(".inline-audio-hideaudTS").hide();
        }

	});

	$(".cmp-insights-inlineaudio--share .insightsInlineaudio-share-social .share-email").focusout(function () {
	$(".insightsInlineaudio-share-social ").hide();
		$(".cmp-insights-inlineaudio--share").attr("aria-expanded", "false");
	});

	$(document).on('keydown', function (event) {
		if (event.keyCode == 27) {
			$(".insightsInlineaudio-share-social ").hide();
			$(".cmp-insights-inlineaudio--share").attr("aria-expanded", "false");
            $(".listenTo_dropdownContain").css({"display" : "none"});
        	$(".listenTo_dropdown").attr("aria-expanded","false");
            $(".cmp-insights-inlineaudio--trans-container").hide();
            $(".inline-audio-viewaudTS").show();
            $(".inline-audio-hideaudTS").hide();
		}
	})


	$("body").click(function(event){
            if(!event.target.closest(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript") && !event.target.closest(".cmp-insights-inlineaudio--trans-container")) {
                if($(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded") === "true") {
                    $(".cmp-insights-inlineaudio--trans-container").css({"display" : "none"});
                    $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded","false");
                    $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-pressed","false");
                    $(".inline-audio-viewaudTS").show();
                    $(".inline-audio-hideaudTS").hide();
                    $(this).find(".transcript-arrow").toggleClass('icon-arrow-up-blue');
            		$(this).find(".transcript-arrow").toggleClass('icon-arrow-down-blue');
                }
            }


             if(!event.target.closest(".listenTo_dropdown") && !event.target.closest(".listenTo_dropdownContain")) {
                if($(".listenTo_dropdown").attr("aria-expanded") === "true") {
                    $(".listenTo_dropdownContain").css({"display" : "none"});
                    $(".listenTo_dropdown").attr("aria-expanded","false");
                    $(".listenTo_dropdown").attr("aria-pressed","false");
                    $(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-down');
            		$(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-up');
                }
            }

        })

		$(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").on('click', function (e) {

            if($(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded") === "true") {
                $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded","false");
                $(".cmp-insights-inlineaudio--transcript .show_transcript").attr("aria-pressed","false");
            }else {
                $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded","true");
                $(".cmp-insights-inlineaudio--transcript .show_transcript").attr("aria-pressed","true");
            }
            let that = $(this).parent().parent().parent();
            $(that).find(".cmp-insights-inlineaudio--trans-container").toggle();
            $(this).find(".inline-audio-viewaudTS").toggle();
            $(this).find(".inline-audio-hideaudTS").toggle();
            $(this).find(".transcript-arrow").toggleClass('icon-arrow-up-blue');
            $(this).find(".transcript-arrow").toggleClass('icon-arrow-down-blue');
		});



    	var $transcriptPopup = $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript");
        $transcriptPopup.on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode == 13) {
            if($(".cmp-insights-inlineaudio--trans-container p a").length > 0) {
                $(".cmp-insights-inlineaudio--trans-container p a:last").on('blur', function (e) { 
						hideTranscriptPopup();
                });
            }
            else {
                $(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").on('focusout', function (e) { 
                    if($(".cmp-insights-inlineaudio--transcript .insights-showaud_transcript").attr("aria-expanded") === "true") {
                        hideTranscriptPopup();
                    }
                });
            }
         }
        });


        function hideTranscriptPopup() {
            $(".cmp-insights-inlineaudio--trans-container").hide();
            $transcriptPopup.attr("aria-expanded","false");
            $transcriptPopup.attr("aria-pressed","false");
            $(".inline-audio-viewaudTS").show();
            $(".inline-audio-hideaudTS").hide();
            $transcriptPopup.find(".transcript-arrow").toggleClass('icon-arrow-up-blue');
            $transcriptPopup.find(".transcript-arrow").toggleClass('icon-arrow-down-blue');
        }

		$(".listenTo_dropdown").each(function (index) {
			$(this).on("click", function (e) {
				e.stopPropagation();

				if($(this).attr("aria-expanded") === "true") {
					$(this).attr("aria-expanded","false");
					$(this).attr("aria-pressed","false");
				}else {
					$(this).attr("aria-expanded","true");
					$(this).attr("aria-pressed","true");
				}


				$(this).next().toggle();
				$(this).find(".fa").toggleClass('fa-angle-down');
				$(this).find(".fa").toggleClass('fa-angle-up');
				});
     	});


    $(".listenTo_dropdown").on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode == 13) {
            if ($(".listenTo_dropdown").attr("aria-expanded") === "true") {
                $(".listenTo_dropdown").attr("aria-expanded", "false");
                $(".listenTo_dropdown").attr("aria-pressed", "false");
            }
            else {
                $(".listenTo_dropdown").attr("aria-expanded", "true");
                $(".listenTo_dropdown").attr("aria-pressed", "true");

            }

            $(".listenTo_dropdownContain").toggle();
            $(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-down');
            $(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-up');
        }
    }); 


    $(".listenTo_dropdownContain ul li:last").focusout(function () {
		$(".listenTo_dropdownContain").hide();
		$(".listenTo_dropdown").attr("aria-expanded","false");
        $(".listenTo_dropdown").attr("aria-pressed","false");
        $(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-down');
        $(".listenTo_dropdown").find(".fa").toggleClass('fa-angle-up');
	});

        var inlineAudioId = $("#inlineaudioID").attr('data-video-id');
        if(inlineAudioId !== undefined || inlineAudioId !== null || inlineAudioId.length >0){
            getVideoSchema(inlineAudioId,".podcast-audio_",".cmp-insights-inlineaudio_transcript_");
        }


}); 
$(document).ready(function () {

	var inlineAudioHeadline = $(".cmp-insights-inlineaudio--heading").text();
	var na="NA";
	var inlineAudioTitle = $(".cmp-insights-inlineaudio--title").text();
	var analyticsLinkValue =  " Share Module | Social | ";
	var emailanalyticsLinkValue = "Share Module | ";
    var analyticsTranscriptValue =(inlineAudioTitle||na)+" |Insights Inline Audio| "+inlineAudioHeadline+" | ";


	$(".insightsInlineaudio-share-social .share-twitter").attr("data-analytics-link",analyticsLinkValue+"Twitter");
	$(".insightsInlineaudio-share-social .share-linkedin").attr("data-analytics-link",analyticsLinkValue+"LinkedIn");
	$(".insightsInlineaudio-share-social .share-facebook").attr("data-analytics-link",analyticsLinkValue+"Facebook");
	$(".insightsInlineaudio-share-social .share-email").attr("data-analytics-link",emailanalyticsLinkValue+"Email");


    $(".inline-audio-viewaudTS").attr("data-analytics-link",analyticsTranscriptValue+"View Transcript");
    $(".inline-audio-hideaudTS").attr("data-analytics-link",analyticsTranscriptValue+"Hide Transcript");                                  

});
$(document).ready(function () {
  if (document.querySelector('.cmp-inlinevideo__container') && $("#inlinevideoID").attr('data-video-id') !== undefined && $("#inlinevideoID").attr('data-video-id') !== null ) {
	var imagesrc = $(".cmp-inlinevideo__image").attr("src");
	var imgPath = "background-image: url(" + imagesrc + ")";
	var inlineVideoHeadline = $('.inline-video-style .cmp-title__text').text();
	var na="NA";
	var analyticsVideoTitle = $(".inlinevideo-title p").text();
	var analyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | Social | ";
	var emailanalyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | ";

	if (imagesrc) {
        const videoDiv = document.getElementById('inlinevideoID');
        const obsever = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length > 0) {
              $("#inlinevideoID .vjs-poster").attr("style", imgPath);
            }
          });
        });
        obsever.observe(videoDiv, {
            childList: true,
            subtree: true
          });
      }

	$(".inlinevideo-share-social .share-twitter").attr("data-analytics-link",analyticsLinkValue+"Twitter");
	$(".inlinevideo-share-social .share-linkedin").attr("data-analytics-link",analyticsLinkValue+"LinkedIn");
	$(".inlinevideo-share-social .share-facebook").attr("data-analytics-link",analyticsLinkValue+"Facebook");
	$(".inlinevideo-share-social .share-email").attr("data-analytics-link",emailanalyticsLinkValue+"Email");


    $(".cmp-inlinevideo-title:empty").hide();

	/* Inline social share */

	$(".inlinevideo-share").each(function (index) {
		$(this).on("click", function (e) {
			e.stopPropagation();
			//$(".inlinevideo-share-social ").toggle();
			$(this).find(".inlinevideo-share-social").animate({
				width: 'toggle'
			});
			if ($(this).find(".inlinevideo-share-social").is(':visible')) {
				$(this).find(".inlinevideo-share").attr("aria-expanded", "true");
			}
			else {
				$(this).find(".inlinevideo-share").attr("aria-expanded", "false");
			}
		});
	});

	$(document).click(function (e) {
		if ($(e.target).parents(".inlinevideo-share-social ").length === 0) {
			$(".inlinevideo-share-social ").hide();
			$(".inlinevideo-share").attr("aria-expanded", "false");
		}
	});


	$(".inlinevideo-share .inlinevideo-share-social .share-email").focusout(function () {
		$(".inlinevideo-share-social ").hide();
		$(".inlinevideo-share").attr("aria-expanded", "false");
	});

	$(document).on('keydown', function (event) {
		if (event.keyCode == 27) {
			$(".inlinevideo-share-social ").hide();
			$(".inlinevideo-share").attr("aria-expanded", "false");
		}
	})


	var inlineVideoId = $("#inlinevideoID").attr('data-video-id');

	$(".cmp-inlinevideo__playbutton").click(function (e) {
		$(this).hide();
		$(".cmp-inlinevideo__duration").hide();

		videojs.getPlayer('inlinevideoID').ready(function () {
			var myPlayer = this;
				myPlayer.catalog.getVideo(inlineVideoId, function (error, video) {
				myPlayer.catalog.load(video);
				myPlayer.play();
				setTimeout(function(){
					$("#inlinevideoID .vjs-play-control").focus().attr("tabindex","0");
				}, 1500);
			});
		});

	});

	$("#inlinevideoID").click(function (e) {
		$(".cmp-inlinevideo__playbutton").hide();
        $(".cmp-inlinevideo__duration").hide();
        setTimeout(function(){
            $("#inlinevideoID .vjs-play-control").focus().attr("tabindex","0");
        }, 1500);
	 });

	$('.cmp-inlinevideo__playbutton').keypress(function (e) {
		var key = e.which;
		if (key == 13 || key == 32) {
			$(".cmp-inlinevideo__playbutton").click();
			return false;
		}
	});

	if ($(".cmp-inlinevideo__image").length > 1) {
		appendInlineVideoDuration(getVideoSchema(inlineVideoId,".cmp-inline-video_",".inlinevideo-transcript_"));
	}

	/** Function to append the VideoJS Object to corresponding VideoCard on the Page **/
	function appendInlineVideoDuration(videoObj) {
		var analyticsVideoButtonValuePlay = (inlineVideoHeadline || na)+" | In-Line Video | "+(videoObj.name).trim()+" | Play";
		var analyticsVideoButtonValue = (inlineVideoHeadline || na)+" | In-Line Video | "+(videoObj.name).trim();
		//	$that.attr("data-video-name", obj.name);

		if(videoObj.name){
			$(".cmp-inlinevideo__playbutton").attr("data-analytics-button",analyticsVideoButtonValuePlay);
			$(".cmp-inlinevideo__image .vjs-play-control").attr("data-analytics-button",analyticsVideoButtonValue);
		}

		if (videoObj.length !== undefined) {
			var _duration = millisToMinutesAndSeconds(videoObj.length);
			if (!_duration.indexOf('NaN') !== -1) {
				$(".cmp-inlinevideo__duration").html(_duration);
			}
		}

	}
  }
});

$(document).ready(function () {
    if ($('.cmp_insight_section_viewall').hasClass('enable-above-hero')) {
        var insightssectionheader = $('.insights-section-header');
        var insightstopicheader = $('.insightstopicheader');
        var insightsectionviewall = $('.insight-section-viewall');
        var enableaboveheroparent= $('<div class="flex-wrapper-hero"></div>');
        if(insightstopicheader.length && insightsectionviewall.length && enableaboveheroparent) {
        insightstopicheader.before(enableaboveheroparent);
        enableaboveheroparent.append(insightstopicheader);
        enableaboveheroparent.append(insightsectionviewall);
        }
        if(insightssectionheader.length && insightsectionviewall.length && enableaboveheroparent) {
        insightssectionheader.before(enableaboveheroparent);
        enableaboveheroparent.append(insightssectionheader);
        enableaboveheroparent.append(insightsectionviewall);
        }
    }

    var viewall_count = 1;
    var viewall_current_height = $(window).height();
    if ($('.cmp_viewall_sublinks').length == 4) {
        $(".cmp_viewall_sublinks").addClass("cmp_viewall_width_four");
    }
    else if ($('.cmp_viewall_sublinks').length == 5) {
        $(".cmp_viewall_sublinks").addClass("cmp_viewall_width_five");
    }

    if ($('.cmp_viewall_grid')) {

        $('#toggle_viewtopic_viewall').click(function() {
            $('.cmp_viewall_container').toggleClass('active');
            $('.cmp_viewall_toplinks_container_below').toggle($('.cmp_viewall_container').hasClass('active'));

            if($('.cmp_viewall_container').hasClass('active')){
                $('#icon').removeClass('fa-angle-down').addClass('fa-angle-up');
            } else {
                $('#icon').removeClass('fa-angle-up').addClass('fa-angle-down');
            }
        });
    }

    if ($('.cmp_viewall_grid_mobile')) {

        $('#cmp_viewall_viewtopic_mobile').click(function() {
            $('.cmp_viewall_viewtopic_mobile_text').toggleClass('active');
            $('.cmp_viewall_toplinks_container_below').toggle($('.cmp_viewall_viewtopic_mobile_text').hasClass('active'));   
            $('.cmp_viewall_container_mobile').toggle($('.cmp_viewall_viewtopic_mobile_text').hasClass('active'));   

            if ($('.cmp_viewall_viewtopic_mobile_text').hasClass('active')){
                $('#icon').addClass('fa-angle-up');
            } else {
                $('#icon').addClass('fa-angle-down');
            }
        });

        $('.cmp_viewall_link').click(function() {
            $(".cmp_viewall_sublinks_wrapper").show();
            $(".cmp_viewall_toplinks_container").hide();
            $(".cmp_viewall_back_arrow_viewall" ).show();
            $(".cmp_viewall_sublink_list").hide();
            $('.cmp_viewall_back_arrow').hide();
         });

         $('.cmp_viewall_back_arrow_viewall').click(function() {
            $(".cmp_viewall_sublinks_wrapper").hide();
            $(".cmp_viewall_toplinks_container").show();
        });

        $(".cmp_viewall_sublinks" ).each(function(index) {
            $(this).on("click", function(event){
                $(".cmp_viewall_sublinks").hide();
                $(this).show();
                $(this).find(".cmp_viewall_sublink_list").show();
                 var title =   $(this).find(".cmp_viewall_sublink_header").text();
                 $('.cmp_viewall_back_arrow').html('<i class="fa fa-angle-left"></i> Back to '+ title).show();
                $('.cmp_viewall_sublink_arrow').show();
                $(".cmp_viewall_back_arrow_viewall" ).hide();
                $(".cmp_viewall_sublink_header").hide();
            });
        });

        $('.cmp_viewall_back_arrow').on('click', function() {
            $(".cmp_viewall_sublinks").show();
            $(".cmp_viewall_sublink_header").show();
            $(".cmp_viewall_sublink_list").hide();
            $(".cmp_viewall_back_arrow_viewall").show();
            $(".cmp_viewall_back_arrow").hide();
        });
    }
           
});
$(document).ready(function () {
    var myPlayers = [];
    var myPlayer;
    var activeVideoID;
    var videoCard = (".cmp-videocard__duration");
    if (videoCard !== undefined || videoCard.length > 0) {
        $("video-js").each(function (index) {
            myPlayers.push(this.id);
            activeVideoID = $(this).attr('data-video-id');
        //     var _duration = millisToMinutesAndSeconds(getVideoSchema(activeVideoID, ".video-card_",".cmp-videocard_transcript_").length);
        //    if (_duration.indexOf('NaN') == -1) {
        //         $(".cmp-videocard__duration" + activeVideoID).text(_duration);
        //     }
        });
    }
    $(".cmp-videocard__nonexistent").click(function () {
        for (var i = 0; i < myPlayers.length; i++) {
            var name = myPlayers[i];
            if (name == $(this).attr('data-videoId')) {
                $('.lightBox' + name + ', .lightboxInner' + name).css({"display": "block"});
                $('.playerClose').focus();
                videojs.getPlayer(name).ready(function () {
                    myPlayer = this;
                    myPlayer.on('loadstart', function () {

                    });
                    myPlayer.play();
                });
                activeVideoID = $(this).attr("data-videoId");
                break;
            }
        }
        /**Modal window keyboard Accessibility**/
        $(".vjs-fullscreen-control, .lightBox").on('keydown', function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9 && (!e.shiftKey)) {
                e.preventDefault();
                $('.playerClose').focus();
            }
        });

        $(".playerClose, .lightBox").on('keydown', function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 9 && e.shiftKey) {
                e.preventDefault();
                $('.vjs-fullscreen-control').focus();
            }
        });

        $(".playerClose, .lightBox").on("click", function () {
            $(".lightboxInner, .lightBox").css({"display": "none"});
            myPlayer.pause();
        });

        $(".lightboxInner" + name).on("keydown", function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode == 27) {
                $(".lightboxInner, .lightBox").css({"display": "none"});
                myPlayer.pause();
            }
        });
    });
});

$(document).ready(function() {

    var $imagesSlider = $('.images-slider, .mobile-insights-carousel');

    //$imagesSlider.on('init reInit afterChange', function(event, slick, currentSlide, nextSlide) {
    $imagesSlider.each(function (index) {
        $(this).on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {
            var i = (currentSlide ? currentSlide : 0) + 1;
            $(this).next().text(('0' + i).slice(-2) + ' / ' + ('0' + slick.slideCount).slice(-2));

            /* prev/next button accessibility fix starts */
            $(this).find(".slick-prev").attr("aria-label", "Previous Article");
            $(this).find(".slick-next").attr("aria-label", "Next Article");

            if ($(this).find(".slick-next").hasClass('slick-disabled')) {
                $(this).find(".slick-next").attr('tabindex', '-1');
            } else {
                $(this).find(".slick-next").attr('tabindex', '0');
            }

            if ($(this).find(".slick-prev").hasClass('slick-disabled')) {
                $(this).find(".slick-prev").attr('tabindex', '-1');
            } else {
                $(this).find(".slick-prev").attr('tabindex', '0');
            }
            /* prev/next button accessibility fix ends */

            /* content slider accessibility fix starts */
            if ($(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").hasClass('slick-current')) {
                $(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").find('a').attr('tabindex', '0');
            }
            $(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").not('.slick-current').find('a').attr('tabindex', -1);
            /* content slider accessibility fix ends */

        });
    });


	/* auto focusing prev/next button after reaching last/first slide */
    $imagesSlider.each(function(index) {
         $(this).on('afterChange', function(event, slick, currentSlide, nextSlide) {
            var i = (currentSlide ? currentSlide : 0) + 1;
            if(i === slick.slideCount) {
                $(this).find(".slick-prev").focus();
            }
            if(i === 1) {
                $(this).find(".slick-next").focus();
            }
        });
    });


    $('.images-slider').each(function(index){
        $(this).addClass("imagesSlider"+index).slick({
            arrows: true,
            slidesToScroll: 1,
            infinite: false,
            // fade: true,
            cssEase: 'ease-out',
            useTransform: true,
            draggable: false,
            accessibility: false,
            asNavFor: '.contentSlider'+index
        });
    });

    $('.content-slider').each(function(index){
        $(this).addClass("contentSlider"+index).slick({
            slidesToShow: 2,
            arrows: false,
            slidesToScroll: 1,
            asNavFor: '.imagesSlider'+index,
            centerMode: false,
            centerPadding: '40px',
            infinite: false,
            draggable: false,
            accessibility: false,
            focusOnSelect: false,
            variableWidth: true
    	});
    });

    $('.mobile-insights-carousel').slick({
        slidesToShow: 1,
        arrows: true,
        slidesToScroll: 1,
        centerMode: false,
        centerPadding: '40px',
        infinite: false,
        focusOnSelect: false,
        variableWidth: true
    });

	/* Analytics for Previous and Next button */
	$('.latestinsight').each(function(index) {
		$(this).find(".slick-prev").attr({'data-analytics-button':$(this).find('.latest-insights-carousel').attr('data-analytics-val')+' | Carousel Left'});
        $(this).find(".slick-next").attr({'data-analytics-button':$(this).find('.latest-insights-carousel').attr('data-analytics-val')+' | Carousel Right'});
    });


	$(".insights-carousel-images .images-slider .slick-next").blur();
	$(".insights-carousel-images .images-slider .slick-list .slick-track .slick-slide").find('a').attr('tabindex', '-1');
	$(".insights-carousel-content .content-slider .slick-list .slick-track .slick-slide").not('.slick-current').find('a').attr('tabindex', -1);

});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('#detailshero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.detailsheroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Play");
                videoPlayed = true;
            } else {
                videojs.players.detailsheroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Pause");
                videoPlayed = false;
            }
		});

        var detailsHeroVideoId = $(".detailshero_video").attr("data-video-id");

        if(!(detailsHeroVideoId == null || detailsHeroVideoId == '' || detailsHeroVideoId == undefined)) {
            getVideoSchema(detailsHeroVideoId,".details-hero-video_",".detailshero_transcript_");
        }

		if($('.composite-container').find('.detailsHero').length !== 0) {
            $('.detailsHero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
		/* Color bar default styling */
        if( $('.detailsHero').find('.detailshero_image').length !== 0 || $('.detailsHero').find('.detailshero_video').length !== 0 ) {
            $('.detailsHero').css('border-left', '0px');
        } 
    });
})(jQuery, jQuery(document));
/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "carousel";

    var keyCodes = {
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" +  NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * Determines whether the Carousel will automatically transition between slides
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autoplay": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Duration (in milliseconds) before automatically transitioning to the next slide
         *
         * @memberof Carousel
         * @type {Number}
         * @default 5000
         */
        "delay": {
            "default": 5000,
            "transform": function(value) {
                value = parseFloat(value);
                return !isNaN(value) ? value : null;
            }
        },
        /**
         * Determines whether automatic pause on hovering the carousel is disabled
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autopauseDisabled": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Carousel Configuration
     *
     * @typedef {Object} CarouselConfig Represents a Carousel configuration
     * @property {HTMLElement} element The HTMLElement representing the Carousel
     * @property {Object} options The Carousel options
     */

    /**
     * Carousel
     *
     * @class Carousel
     * @classdesc An interactive Carousel component for navigating a list of generic items
     * @param {CarouselConfig} config The Carousel configuration
     */
    function Carousel(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Carousel
         *
         * @private
         * @param {CarouselConfig} config The Carousel configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            that._active = 0;
            that._paused = false;

            if (that._elements.item) {
                refreshActive();
                bindEvents();
                resetAutoplayInterval();
                refreshPlayPauseActions();
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Carousel component
                 * - if so, route the "navigate" operation to enact a navigation of the Carousel based on index data
                 */
                new window.Granite.author.MessageChannel("cqauthor", window).subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-carousel" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Caches the Carousel elements as defined via the {@code data-carousel-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Carousel wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                if (that._elements[key]) {
                    if (!Array.isArray(that._elements[key])) {
                        var tmp = that._elements[key];
                        that._elements[key] = [tmp];
                    }
                    that._elements[key].push(hook);
                } else {
                    that._elements[key] = hook;
                }
            }
        }

        /**
         * Sets up properties for the Carousel based on the passed options.
         *
         * @private
         * @param {Object} options The Carousel options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Carousel event handling
         *
         * @private
         */
        function bindEvents() {
            if (that._elements["previous"]) {
                that._elements["previous"].addEventListener("click", function() {
                    navigate(getPreviousIndex());
                });
            }

            if (that._elements["next"]) {
                that._elements["next"].addEventListener("click", function() {
                    navigate(getNextIndex());
                });
            }

            var indicators = that._elements["indicator"];
            if (indicators) {
                for (var i = 0; i < indicators.length; i++) {
                    (function(index) {
                        indicators[i].addEventListener("click", function(event) {
                            navigateAndFocusIndicator(index);
                        });
                    })(i);
                }
            }

            if (that._elements["pause"]) {
                if (that._properties.autoplay) {
                    that._elements["pause"].addEventListener("click", onPauseClick);
                }
            }

            if (that._elements["play"]) {
                if (that._properties.autoplay) {
                    that._elements["play"].addEventListener("click", onPlayClick);
                }
            }

            that._elements.self.addEventListener("keydown", onKeyDown);

            if (!that._properties.autopauseDisabled) {
                that._elements.self.addEventListener("mouseenter", onMouseEnter);
                that._elements.self.addEventListener("mouseleave", onMouseLeave);
            }
        }

        /**
         * Handles carousel keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["indicator"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusIndicator(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusIndicator(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusIndicator(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusIndicator(lastIndex);
                    break;
                case keyCodes.SPACE:
                    if (that._properties.autoplay && (event.target !== that._elements["previous"] && event.target !== that._elements["next"])) {
                        event.preventDefault();
                        if (!that._paused) {
                            pause();
                        } else {
                            play();
                        }
                    }
                    if (event.target === that._elements["pause"]) {
                        that._elements["play"].focus();
                    }
                    if (event.target === that._elements["play"]) {
                        that._elements["pause"].focus();
                    }
                    break;
                default:
                    return;
            }
        }

        /**
         * Handles carousel mouseenter events
         *
         * @private
         * @param {Object} event The mouseenter event
         */
        function onMouseEnter(event) {
            clearAutoplayInterval();
        }

        /**
         * Handles carousel mouseleave events
         *
         * @private
         * @param {Object} event The mouseleave event
         */
        function onMouseLeave(event) {
            resetAutoplayInterval();
        }

        /**
         * Handles pause element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPauseClick(event) {
            pause();
            that._elements["play"].focus();
        }

        /**
         * Handles play element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPlayClick() {
            play();
            that._elements["pause"].focus();
        }

        /**
         * Pauses the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function pause() {
            that._paused = true;
            clearAutoplayInterval();
            refreshPlayPauseActions();
        }

        /**
         * Enables the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function play() {
            that._paused = false;

            // If the Carousel is hovered, don't begin auto transitioning until the next mouse leave event
            var hovered = false;
            if (that._elements.self.parentElement) {
                hovered = that._elements.self.parentElement.querySelector(":hover") === that._elements.self;
            }
            if (that._properties.autopauseDisabled || !hovered) {
                resetAutoplayInterval();
            }

            refreshPlayPauseActions();
        }

        /**
         * Refreshes the play/pause action markup based on the {@code Carousel#_paused} state
         *
         * @private
         */
        function refreshPlayPauseActions() {
            setActionDisabled(that._elements["pause"], that._paused);
            setActionDisabled(that._elements["play"], !that._paused);
        }

        /**
         * Refreshes the item markup based on the current {@code Carousel#_active} index
         *
         * @private
         */
        function refreshActive() {
            var items = that._elements["item"];
            var indicators = that._elements["indicator"];

            if (items) {
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        if (i === parseInt(that._active)) {
                            items[i].classList.add("cmp-carousel__item--active");
                            items[i].removeAttribute("aria-hidden");
                            indicators[i].classList.add("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", true);
                            indicators[i].setAttribute("tabindex", "0");
                        } else {
                            items[i].classList.remove("cmp-carousel__item--active");
                            items[i].setAttribute("aria-hidden", true);
                            indicators[i].classList.remove("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", false);
                            indicators[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one item
                    items.classList.add("cmp-carousel__item--active");
                    indicators.classList.add("cmp-carousel__indicator--active");
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Retrieves the next active index, with looping
         *
         * @private
         * @returns {Number} Index of the next carousel item
         */
        function getNextIndex() {
            return that._active === (that._elements["item"].length - 1) ? 0 : that._active + 1;
        }

        /**
         * Retrieves the previous active index, with looping
         *
         * @private
         * @returns {Number} Index of the previous carousel item
         */
        function getPreviousIndex() {
            return that._active === 0 ? (that._elements["item"].length - 1) : that._active - 1;
        }

        /**
         * Navigates to the item at the provided index
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigate(index) {
            if (index < 0 || index > (that._elements["item"].length - 1)) {
                return;
            }

            that._active = index;
            refreshActive();

            // reset the autoplay transition interval following navigation, if not already hovering the carousel
            if (that._elements.self.parentElement) {
                if (that._elements.self.parentElement.querySelector(":hover") !== that._elements.self) {
                    resetAutoplayInterval();
                }
            }
        }

        /**
         * Navigates to the item at the provided index and ensures the active indicator gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusIndicator(index) {
            navigate(index);
            focusWithoutScroll(that._elements["indicator"][index]);
        }

        /**
         * Starts/resets automatic slide transition interval
         *
         * @private
         */
        function resetAutoplayInterval() {
            if (that._paused || !that._properties.autoplay) {
                return;
            }
            clearAutoplayInterval();
            that._autoplayIntervalId = window.setInterval(function() {
                if (document.visibilityState && document.hidden) {
                    return;
                }
                var indicators = that._elements["indicators"];
                if (indicators !== document.activeElement && indicators.contains(document.activeElement)) {
                    // if an indicator has focus, ensure we switch focus following navigation
                    navigateAndFocusIndicator(getNextIndex());
                } else {
                    navigate(getNextIndex());
                }
            }, that._properties.delay);
        }

        /**
         * Clears/pauses automatic slide transition interval
         *
         * @private
         */
        function clearAutoplayInterval() {
            window.clearInterval(that._autoplayIntervalId);
            that._autoplayIntervalId = null;
        }

        /**
         * Sets the disabled state for an action and toggles the appropriate CSS classes
         *
         * @private
         * @param {HTMLElement} action Action to disable
         * @param {Boolean} [disable] {@code true} to disable, {@code false} to enable
         */
        function setActionDisabled(action, disable) {
            if (!action) {
                return;
            }
            if (disable !== false) {
                action.disabled = true;
                action.classList.add("cmp-carousel__action--disabled");
            } else {
                action.disabled = false;
                action.classList.remove("cmp-carousel__action--disabled");
            }
        }
    }

    /**
     * Reads options data from the Carousel wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Carousel element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Carousel components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Carousel({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Carousel({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());


$(document).ready(function () {

  var $heroSliderCount = $('.hero-slider-count');
  var $slickElement = $('.hero-slider-content');
  var sliderItemCount = $(".hero-content-piece").length + $(".hero-content-explore").length;
  var currentSlideItem = 0;



  $slickElement.on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {

    currentSlideItem = currentSlide;
    var i = (currentSlide ? currentSlide : 0) + 1;
    $heroSliderCount.text(('0' + i).slice(-2) + ' / ' + ('0' + slick.slideCount).slice(-2));
  });

  function heroCarouselInit(){

   var screenWidth = 0;
      screenWidth = window.innerWidth;

  $('.slider-hero').slick({
    arrows: false,
    slidesToScroll: 1,
    infinite: false,
    fade: true,
    cssEase: 'ease-out',
    useTransform: true,
    asNavFor: '.hero-slider-content'
  });

  if( screenWidth >= 1025){

  $('.hero-slider-content').slick({
        slidesToShow: sliderItemCount,
        slidesToScroll: 1,
        arrows: true,
        fade: false,
        asNavFor: '.slider-hero',
        centerMode: false,
        centerPadding: '40px',
        infinite: false,
        draggable: false,
        focusOnSelect: true
    }); 
  }
  else {
  $('.hero-slider-content').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: true,
      fade: false,
      asNavFor: '.slider-hero',
      centerMode: false,
      centerPadding: '40px',
      infinite: false,
      draggable: false,
      focusOnSelect: false,
      variableWidth: true

    });

}
	$('.herocarousel .slick-prev').attr("data-analytics-button","Homepage Hero | Carousel Left");
    $('.herocarousel .slick-next').attr("data-analytics-button","Homepage Hero | Carousel Right");
    $($(".herocarousel .slider-hero img")[0]).removeAttr("loading"); 


    $(this).on('load', function(){     
		onKeyUpClickItems();
     });//end of onload event 

 }

 heroCarouselInit();

    function onKeyUpClickItems() {
        var $heroContentPiece = $('.hero-slider-content .hero-content-piece');
        $.each($heroContentPiece, function (key, val) {
            $(this).on("keyup mouseover", function (e) {
                e.preventDefault();
                $(this).click();        
                if ($heroContentPiece.hasClass("hero-content-piece--active")) {
                    $heroContentPiece.removeClass('hero-content-piece--active');
                    $(this).addClass('hero-content-piece--active');
                }    
            }); //end of register keyup and mouse over evernt
        });
    }


    $(window).resize(resizeHeroCarousel);

    function resizeHeroCarousel() {
        $('.slider-hero').slick('unslick');
        $('.hero-slider-content').slick('unslick');
        onKeyUpClickItems();
        var currentActiveItemBeforeInit = currentSlideItem;
        heroCarouselInit();
        $('.slider-hero').slick('slickGoTo', currentActiveItemBeforeInit);
    }

});
(function ($, $document) {
    /* Trigger on page load */
    $(document).ready(function () {
        "use strict";
        var videoPlayed = true;
    	$('#subcategoryhero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.subcategoryheroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", "Hero | Looping Video | Play");
                videoPlayed = true;
            } else {
                videojs.players.subcategoryheroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
                $(this).attr("data-analytics-button", "Hero | Looping Video | Pause");
                videoPlayed = false;
            }
		});

		var subCatHeroVideoId = $(".subcategoryhero_video").attr("data-video-id");

        if(!(subCatHeroVideoId == null || subCatHeroVideoId == '' || subCatHeroVideoId == undefined)) {
            getVideoSchema(subCatHeroVideoId,".subcategory-hero-video_",".subcategoryhero_transcript_");
        }

		if($('.composite-container').find('.subcategoryhero').length !== 0) {
            $('.subcategoryhero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
        
    });
})(jQuery, jQuery(document));
$(document).ready(function () {

    $.each($(".cmp-pullquote"), function (key, val) {
        if ($(this).find(".cmp-pullquote__image").length == 0) {
            $(this).addClass("no-image");
        }
    });

});
/* Trigger on page load */
$(document).ready(function () {
    "use strict";
    var videoPlayed = true;
    var heroTitle = $(".cmp-practicehero .practiceherotitle").text().trim();
    const comp = document.getElementsByClassName('practiceheroV4');
    var heroTitlePause = heroTitle + " | Hero | Looping Video | Pause";
    var heroTitlePlay = heroTitle + " | Hero | Looping Video | Play";
    if (comp !== undefined && comp !== null && comp.length !== 0) {
        $('#practicehero_video_id').on("click", function () {
            if (videoPlayed == false) {
                videojs.players.heroPlayerID.play();
                $(this).find("span").addClass("pause-video");
                $(this).find("span").removeClass("play-video");
                $(this).attr("aria-label", "Play");
                $(this).attr("data-analytics-button", heroTitlePause);
                videoPlayed = true;
            } else {
                videojs.players.heroPlayerID.pause();
                $(this).find("span").addClass("play-video");
                $(this).find("span").removeClass("pause-video");
                $(this).attr("aria-label", "Pause");
                videoPlayed = false;
                $(this).attr("data-analytics-button", heroTitlePlay);
                videoPlayed = false;
            }
        });

        var practiceHeroVideoId = $(".practicehero_video").attr("data-video-id");

        if (!(practiceHeroVideoId == null || practiceHeroVideoId == '' || practiceHeroVideoId == undefined)) {
            getVideoSchema(practiceHeroVideoId, ".practice-hero-video_",".practicehero-transcript_");
        }

        if ($('.composite-container').find('.practicehero').length !== 0) {
            $('.practicehero').closest('.composite-container').addClass('hero__composite-margin-bottom');
        }
    }

});
/* Trigger on page load */
$(document).ready(function () {
    "use strict";
    const comp = document.getElementsByClassName('practiceheroV4');
    var practiceHeroFirstCtaVideoId = $("#firstCtaVideo").attr("data-video-id");
    var practiceHeroSecondCtaVideoId = $("#secondCtaVideo").attr("data-video-id");

    if (comp !== undefined && comp !== null && comp.length !== 0) {
        if (!(practiceHeroFirstCtaVideoId == null || practiceHeroFirstCtaVideoId == '' || practiceHeroFirstCtaVideoId == undefined)) {
            getVideoSchema(practiceHeroFirstCtaVideoId, ".practice-hero-video_",".practicehero-transcript_");
        }
        if (!(practiceHeroSecondCtaVideoId == null || practiceHeroSecondCtaVideoId == '' || practiceHeroSecondCtaVideoId == undefined)) {
            getVideoSchema(practiceHeroSecondCtaVideoId, ".practice-hero-video_",".practicehero-transcript_");
        }

        $('.firstCtaButton_video').click(function () {
            $('.lightboxInnerFirstCta').css('display', 'block');
            $('.lightboxFirstCta').css('display', 'block');
            videojs.players.firstCtaVideo.play();
        });
        $('.firstCtaButton_keyfocus_video_play').keypress(function (event) {
            if (event.keyCode === 13) {
                $('.lightboxInnerFirstCta').css('display', 'block');
                $('.lightboxFirstCta').css('display', 'block');
                videojs.players.firstCtaVideo.play();
            }
        });
        $('.playerCloseAB, .lightboxFirstCta').click(function () {
            $('.lightboxInnerFirstCta').css('display', 'none');
            $('.lightboxFirstCta').css('display', 'none');
            videojs.players.firstCtaVideo.pause();

        })

        $('.secondCtaButton_video').click(function () {

            $('.lightboxInnerSecondCta').css('display', 'block');
            $('.lightBoxSecondCta').css('display', 'block');
            videojs.players.secondCtaVideo.play();
        });
        $('.secondCtaButton_keyfocus_video_play').keypress(function (event) {
            if (event.keyCode === 13) {
                $('.lightboxInnerSecondCta').css('display', 'block');
                $('.lightBoxSecondCta').css('display', 'block');
                videojs.players.secondCtaVideo.play();
            }
        });
        $('.playCloseSecondCta, .lightBoxSecondCta').click(function () {
            $('.lightboxInnerSecondCta').css('display', 'none');
            $('.lightBoxSecondCta').css('display', 'none');
            videojs.players.secondCtaVideo.pause();
        })

    }
});

$(document).ready(function() {
	$(".wm-service .cmp-wms-count").each(function( index ) {
		var getcolumnCount = $(this).children().length;
		$(this).addClass("columnCount_"+getcolumnCount);
		});

    $(".cmp_wms_blocks").each(function (index) {
        if($(this).find(".cmp_wms_normal_link").length > 0) {
            $(this).parent().addClass("normalLinkPresent");
        } 
        if($(this).find(".cmp_wms_numeric").children().length == 4 ) {
            $(this).parent().addClass("presentGroupItems4");
        }
        if($(this).find(".cmp_wms_numeric").children().length == 3 ) {
            $(this).parent().addClass("presentGroupItems3");
        }
        if($(this).find(".cmp_wms_numeric").children().length == 2 ) {
            $(this).parent().addClass("presentGroupItems2");
        }
        if($(this).find(".cmp_wms_numeric").children().length == 1 ) {
            $(this).parent().addClass("presentGroupItems1");
        }
	}); 
});

$(document).ready(function() {

     $(".cmp-summaryTags--description a").each(function(index) {

		  $(this).attr("data-analytics-link","In-Line Body Text Link |" + $(this).text().trim());
    });

   $(".cmp-summaryTags--footnotes a").each(function(index) {
   		$(this).attr("data-analytics-link","Footnotes | " + $(this).text().trim());

    });

});


$(document).ready(function() {
    let summaryTagsComp = $(".cmp-summaryTags--container");
    if(summaryTagsComp !== undefined && summaryTagsComp !== null && summaryTagsComp.length >0){
        var currentPagePath = window.location.pathname.replace("editor.html/","").replace(".html","/");
        $.ajax({
            url: currentPagePath+'/eyebrow.dynadata_summary-tags-results.json',
            method: "GET",
            success: function(jsonObject) {
                if('data' in jsonObject){
                    var dataObject = jsonObject.data;
                        Object.keys(dataObject).forEach(function(key) {
                            var link = dataObject[key]+".html";
                            if(link !== null)
                            {
                                $(".cmp-summaryTags--container").append("<div class='cmp-summaryTags--lagsList'><a href="+link+">"+key+"</a></div>");
                             }else{
                                $(".cmp-summaryTags--container").append("<div class='cmp-summaryTags--lagsList'>"+key+"</a></div>");
                             }
                        })
                    }
            },
            error: function(data) {
                console.log(data);
            }
        });
    }
});
$(document).ready(function () {

    var url = window.location.href;
    if (url.indexOf('students-graduates/opportunities') > -1) {
        var splitURL = url.split("/");
        var contextPath = '/' + splitURL[3];
        if (splitURL[splitURL.length - 1] !== 'not-found') {
            var jobDataArray = getBusinessAreaVariation();
            var pageNotFound;
            if (jobDataArray[1]) {
                if (MSCOM.pageData.isAuthor) {
                    pageNotFound = origin + contextPath + '/content/msdotcom/en/career/students-graduates/opportunities/not-found';
                } else {
                    pageNotFound = origin + '/career/students-graduates/opportunities/not-found';
                }
                window.location.replace(pageNotFound);
            } else {
                getExprienceFrgments(jobDataArray[0]);
            }
        }
    }
});

function getBusinessAreaVariation() {

    var businessAreaVariation = "";
    var jobNo = $(".cmp-opportunitydetail-container").attr('job-id');
    var jobIDNotFound = (jobNo !== undefined);
    var careerURL, heroCareerEyeBrow, postLabel;
    var getURLString = window.location.pathname.search("students-graduates/opportunities");


    if (getURLString > -1) {
        careerURL = careerAPI;
        heroCareerEyeBrow = "STUDENTS & GRADUATES";
        postLabel = "Application Deadline";
    }
    const compDiv = $(".cmp-opportunitydetail-container");
    if(compDiv == undefined && compDiv.length <=0 ){
        return;
    }

    $.ajax({
        url: careerURL,
        async: false,
        method: "GET",
        contentType: 'application/json',
        dataType: "json",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            var html_to_append = '';
            $.each(data.resultSet, function (i, item) {
                if (this.jobNumber == jobNo) {
                    jobIDNotFound = false;
                    businessAreaVariation = this.businessArea;

                    return false;
                }
            });
        },
        error: function (data) {
            console.log(data);
        }
    });

    var jobDataArray = [businessAreaVariation, jobIDNotFound]
    return jobDataArray;
}

function getTitleAndDescription() {
    var careerURL, heroCareerEyeBrow, postLabel;
    var jobNo = $(".cmp-opportunitydetail-container").attr('job-id');
    var getURLString = window.location.pathname.search("students-graduates/opportunities");
    if (getURLString > -1) {
        careerURL = careerAPI;
        heroCareerEyeBrow = "STUDENTS & GRADUATES";
        postLabel = "Application Deadline";
    }
    const compDiv = $(".cmp-opportunitydetail-container");
    if(compDiv == undefined && compDiv.length <=0 ){
        return;
    }
    $.ajax({
        url: careerURL,
        async: false,
        method: "GET",
        contentType: 'application/json',
        dataType: "json",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            var html_to_append = '';
            $.each(data.resultSet, function (i, item) {
                if (this.jobNumber == jobNo) {
                    // jobIDNotFound = false;
                    // businessAreaVariation = this.businessArea;
                    html_to_append = '<div><h2 class="job-description">Program Description</h2></div>';

                    html_to_append += this.jobHtmlDescription;

                    let businessAreaLabel = this.businessArea == null ? "" : this.businessArea;
                    let divisionLabel = this.division == null ? "" : this.division;
                    let seprateChar = " | "
                    if (businessAreaLabel === divisionLabel) {
                        divisionLabel = "";
                    }
                    if (businessAreaLabel == "" || divisionLabel == "") {
                        seprateChar = " ";
                    }

                    $(".cmp-opportunitydetail-container .shortTitle__parent_eyebrow").empty();
                    $(".cmp-opportunitydetail-container .shortTitle__parent_eyebrow").text(capitalizeString(this.opportunity));
                    $(".cmp-opportunitydetail-container .detailsherotitle").html(this.jobTitle);
                    $(".detailsherotitle").after('<div class="career-businessarea">' + businessAreaLabel + seprateChar + divisionLabel + '</div>' +
                        '<div class="career-location">' + this.location + '</div>' +
                        '<div class="career-jobid"> Job # ' + this.jobNumber + '</div>' +
                        '<div class="career-posteddate">' + postLabel + ': ' + this.applicationDate + '</div>' +
                        '<div class="career-programtype"> Program Type: ' + this.jobLevel + '</div>' +
                        '<div class="apply_button"><a class="button--done" data-analytics-link = "S&G | Opportunity Hero | ' + this.jobTitle + ' | Apply Now" data-analytics-module = "Opportunity Hero | ' +
                        this.jobTitle + ' | NA' + '" data-analytics-job-card = "S&G | ' + this.jobTitle + ' | ' + this.location + ' | ' +
                        this.businessArea + ' | ' + this.employmentType + ' | ' + this.jobNumber + '" data-analytics-button-cta = "S&G | Opportunity Hero | ' +
                        this.jobTitle + ' | Apply Now" href="' + this.url + '" target="_blank">Apply Now</a></div>');


                    getLocations(this.allRegion, this.city, this.allCountries, jobNo);
                    getmeetTheTeam(this.db_business_unit, this.allDivision, businessAreaLabel, this.allCity);

                    $($('.midweight-cta')[0]).find(".button--firstCtaLink").attr("href", this.url).attr('target', '_blank');

                    /* Update URL for CTA button*/
                    if ($($('.midweight-cta')[1]).find(".button--firstCtaLink").length > 0) {
                        let url = window.location.href;
                        let arr = url.split("/");
                        if (arr[3] !== 'auth' || arr[3] !== 'pub') {
                            let urlString = $($('.midweight-cta')[1]).find(".button--firstCtaLink").attr('href');
                            let updatedHref = urlString.split('/msdotcom/en')[1];
                            $($('.midweight-cta')[1]).find(".button--firstCtaLink").attr("href", updatedHref);

                            $(".cmp-opportunitydetail-container .more-insights .storycard .cmp-storycard__link").each(function () {
                                let urlStringMWC = $(this).attr('href');
                                let updatedHrefMWC = urlStringMWC.split('/msdotcom/en')[1];
                                $(this).attr("href", updatedHrefMWC);
                            });

                            $(".cmp-opportunitydetail-container .meet-the-team .cmp-personcard__link").each(function () {
                                let urlStringProfile = $(this).attr('href');
                                let updatedHrefProfile = urlStringProfile.split('/msdotcom/en')[1];
                                $(this).attr("href", updatedHrefProfile);
                            });

                        }

                    }
                    $(".cmp-opportunitydetail-container .shortTitle__parent_eyebrow").click(function () {
                        window.open(studentGraduatesPoint);
                    });
                    return false;
                }
            });
            $(".opportunitydetail .details-description").html(html_to_append);
            window.scrollTo(0, 0);

            $(".decription p, .decription span, .decription ul, .decription li, .decription table, .decription h1, .decription h2, .decription h3, .decription h4, .decription h5, .decription h6, .decription div, .decription font").removeAttr("style");
            $(".decription .MsoNormal").attr("face", "").attr("size", "").attr("color", "");
            $(".decription font").attr("face", "").attr("size", "").attr("color", "");
            $('.decription p, .decription span, .decription div, .decription table, .decription tr, .decription td').each(function () {
                if ($(this).text().trim() === '')
                    $(this).remove();
            });
            $(".decription p").html(function (i, html) {
                return html.replace(/&nbsp;/g, ' ');
            });

            $(".details-description a").each(function (index) {
                $(this).attr("data-analytics-link", $('.detailsherotitle').text().trim() + " | Body-Text Link | " + $(this).text().trim());
            });
            newWindowLinks();
        },
        error: function (data) {
            console.log(data);
        }
    });

}

function getExprienceFrgments(businessAreaExperience) {

    /* Mid Weight-CTA */

    var $midWeightCta = $('.midweight-cta');
    var origin = window.location.origin;
    var experienceFragmentPath = '/content/experience-fragments/msdotcom/students_graduates/opportunities/dynadata/opportunity-detail';

    switch (businessAreaExperience) {
        case 'Company':
            expFragmentUrl = origin + experienceFragmentPath + '/Company.html';
            break;
        case 'Operations':
            expFragmentUrl = origin + experienceFragmentPath + '/Operations.html';
            break;
        case 'Technology':
            expFragmentUrl = origin + experienceFragmentPath + '/Technology.html';
            break;
        case 'Wealth Management':
            expFragmentUrl = origin + experienceFragmentPath + '/Wealth-Management.html';
            break;
        case 'Investment Management':
            expFragmentUrl = origin + experienceFragmentPath + '/Investment-Management.html';
            break;
        case 'Institutional Securities Group':
            expFragmentUrl = origin + experienceFragmentPath + '/Institutional-Securities-Group.html';
            break;
        default:
            expFragmentUrl = origin + experienceFragmentPath + '/master.html';
    }

    const compDiv = $(".cmp-opportunitydetail-container");
    if(compDiv == undefined && compDiv.length <=0 ){
        return;
    }
    $.ajax({
        url: expFragmentUrl,
        async: false,
        type: 'GET',
        success: function (data) {
            $(".career-hero").html($(data).find('.detailsHero')).html();
            $(".locationCards").html($(data).find('.locationtitle')).html();
            $.each($midWeightCta, function (i, key) {
                $($(".midweight-cta")[i]).html($(data).find('.mid-weight-cta')[i]).html();
            });
            $(".more-insights").html($(data).find('.four-up__style ')).html();

            setAnalyticsAttrForEndlessGrid();

            let storyCardClass = $(".storycard");
            $.each(storyCardClass, function (i, key) {
                $(this).removeClass();
                $(this).addClass("storycard aem-GridColumn aem-GridColumn--default--none aem-GridColumn--offset--default--0 aem-GridColumn--default--3");
            });
            $(".meetthe-team").html($(data).find('.meet-the-team')).html();

            getTitleAndDescription();
        }
    });

    /* Mid Weight-CTA Ends*/
}


/* Set analytics attr for endless grid starts */

function setAnalyticsAttrForEndlessGrid() {
    var sectionSelectors = [".cmp-opportunitydetail-container .two-up__style", ".cmp-opportunitydetail-container .three-up__style", ".cmp-opportunitydetail-container .four-up__style"],
        CARD_SELECTOR = ".r4card",
        SECTION_TITLE_SELECTOR = ".cmp-title__text",
        BAR_SEPARATOR = " | ",
        DATA_ANALYTICS_LINK = "data-analytics-link",
        DATA_ANALYTICS_MODULE = "data-analytics-module",
        PRESS_RELEASE_CARD_IDENTIFIER = "cmp-pressreleasecard",
        PRESS_RELEASE_CARD_COLORBOX_SELECTOR = ".cmp-pressreleasecard__colorbox";

    $.each(sectionSelectors, function (index, sectionSelector) {
        var $sections = $(document).find(sectionSelector);
        if (!$sections) return;
        $.each($sections, function (index, section) {
            var $section = $(section),
                sectionTitle = getCareerSectionTitle($section),
                cardList = $section.find(CARD_SELECTOR);
            if (!cardList) return;
            addCareerCardPositionClass(cardList);

            sectionTitle = sectionTitle ? sectionTitle : "NA";
            addCareerAnalyticsAttributes(cardList, sectionTitle);
        });
    });

    /* Get the title of the Two Up or Three Up or Four Up section */
    function getCareerSectionTitle($section) {
        var $titleElem = $section.find(SECTION_TITLE_SELECTOR);
        if (!$titleElem) return;
        var title = $titleElem = $titleElem.text() ? $titleElem.text() : $section.find(".endlessgrid_title").text();
        return title.trim();
    }

    /* Adds the required Analytics Attributes */
    function addCareerAnalyticsAttributes(cardList, sectionTitle) {
        var count = 0;
        $.each(cardList, function (index, card) {
            count++;
            var $card = $(card), $cardLink;
            if ($card.hasClass(PRESS_RELEASE_CARD_IDENTIFIER)) {
                $cardLink = $card.find(PRESS_RELEASE_CARD_COLORBOX_SELECTOR);
            } else $cardLink = $card.find("a");
            if (!$cardLink) return;
            var analyticsLinkValue = $cardLink.attr(DATA_ANALYTICS_LINK),
                totalCards = cardList.length, column;
            column = totalCards >= 4 ? 4 : totalCards;
            if (analyticsLinkValue) {
                setCareerAnalyticsAttribute($cardLink, DATA_ANALYTICS_LINK, sectionTitle + BAR_SEPARATOR +
                    column + "-Card Module" + BAR_SEPARATOR + analyticsLinkValue);
            }
            var analyticsModuleValue = $cardLink.attr(DATA_ANALYTICS_MODULE);

            if (analyticsModuleValue) {
                setCareerAnalyticsAttribute($cardLink, DATA_ANALYTICS_MODULE, analyticsModuleValue + BAR_SEPARATOR
                    + "Position " + count + " of " + totalCards);
            }
        });
    }

    /* Sets the attribute */
    function setCareerAnalyticsAttribute($cardLink, attributeKey, attributeValue) {
        $cardLink.each(function (index, element) {
            if (index === 0) $(element).attr(attributeKey, attributeValue);
        });
    }

    /* Sets position class to the card */
    function addCareerCardPositionClass(cardList) {
        $.each(cardList, function (index, card) {
            index++;
            $(card).addClass("card-position-" + index);
        });
    }
}

function getLocations(region, city, country, jobId) {
    let cityName = city.replace(/\s+/g, '-').toLowerCase();
    let countryName = country.replace('United States of America', 'united-states');
    countryName = countryName.replace('Korea, Republic of', 'south-korea');
    countryName = countryName.replace(/\s+/g, '-').toLowerCase();
    countryName = countryName.replace(/,/g, '|');
    countryName = countryName.replace('china', 'greater-china');
    let contries = country.replace('Korea, Republic of', 'Republic of Korea').split(',');
    let contryKeys = countryName.split('|');
    let countryDisplayNames = {}
    let locatonAPiEndPoint = '';
    for (let i = 0; i < contryKeys.length; i++) {
        countryDisplayNames[contryKeys[i]] = contries[i]
        if (i !== contryKeys.length)
            locatonAPiEndPoint += region + "|" + contryKeys[i] + '/';
        else
            locatonAPiEndPoint += region + "|" + contryKeys[i];
    }
    let locationURL = locationAPI + locatonAPiEndPoint;

    $.ajax({
        url: locationURL,
        method: "GET",
        async: false,
        contentType: 'application/json',
        dataType: "json",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (data) {
            renderLocation(data, cityName, region, country, jobId, countryDisplayNames);
        },
        error: function (data) {
            console.log("opportunity details location error :: ", data);
        }
    });
}

function renderLocation(data, cityName, region, country, jobId, countryDisplayNames) {

    let keys = Object.keys(data);
    let html_to_append = '';
    let count = 0;
    let position = 1;
    for (let key in data) {
        if (count < 4)
            count++;
        countryDisplayNames[key] = countryDisplayNames[key] == "China" ? "Greater China" : countryDisplayNames[key];
        html_to_append += '<div class="storycard aem-GridColumn aem-GridColumn--default--none aem-GridColumn--offset--default--0 aem-GridColumn--default--1">'
            + '<div data-gridclasses="aem-GridColumn aem-GridColumn--default--none aem-GridColumn--offset--default--0 aem-GridColumn--default--3"'
            + 'class="cmp-storycard r4card card-position-1">'
            + '<a class="cmp-storycard__link" target="_blank" href="' + data[key].url + '"'
            + 'data-analytics-link="' + $('.location_title').text().trim() + ' | Location Card | ' + countryDisplayNames[key] + '| NA"'
            + ' data-analytics-module="Location Card | ' + countryDisplayNames[key] + ' | Position ' + position + ' of ' + keys.length + '">'
            + '<div class="cmp-storycard__image">'
            + ' <picture>'
            + '<source media="(max-width: 767px)"'
            + ' srcset="' + locationImagePoint + data[key].fileReference + '/_jcr_content/renditions/square_1x1.jpg">'
            + '<source media="(max-width: 1024px)"'
            + '   srcset="' + locationImagePoint + data[key].fileReference + '/_jcr_content/renditions/wide_16x9.jpg">'
            + '<source media="(max-width: 1440px)"'
            + ' srcset="' + locationImagePoint + data[key].fileReference + '/_jcr_content/renditions/wide_16x9.jpg">'
            + '<img src="' + locationImagePoint + data[key].fileReference + '/_jcr_content/renditions/wide_16x9.jpg"'
            + ' class="cmp-image__image" data-cmp-hook-image="image" alt="card-image">'
            + '</picture>'
            + '<span class="region-tag"><i class="fa fa-map-marker"></i>' + region + '</span>'
            + '</div>'
            + '<div class="cmp-storycard__content card_content">'
            + '<div class="cmp-storycard__eyebrow">LOCATION</div>'
            + '<span class="cmp-storycard__title card_title">'
            + countryDisplayNames[key]
            + '</span>'
            + '</div>'
            + '</a>'
            + '</div>'
            + '</div>';
        position++;
    }

    $(".location_title").after('<div class="locationCardsArea"></div>');
    $(".locationCardsArea").html(html_to_append);
    $(".locationCardsArea").addClass("card_count_" + count);
}
var ACCORDION_WRAPPER_CLASS = "acc-wrap",
    FILTER_LABEL_CLASS = "filter-label",
    LOCATION_FILTER_CLASS = "accordion--location__filters",
    FILTER_DONE_BTN_SELECTOR = ".cmp-opportunity--filter--resultset .filter-done a",
    enteredKeyword;
$(document).ready(function () {
    const oppAggComp = $(".cmp-opportunity-aggregate");
    if(oppAggComp == undefined && oppAggComp.length <=0 ){
        return;
    }
    var checkboxes = document.querySelectorAll(".cmp-opportunity--filter--resultset .checkbox input");

    for (let count = 0; count < checkboxes.length; count++) {
        checkboxes[count].addEventListener('change', function (event) {
            let parentWrapper = findAncestor(event.target, ACCORDION_WRAPPER_CLASS),
                filterLabel = parentWrapper.querySelector("." + FILTER_LABEL_CLASS).textContent.trim(),
                filterDoneBtn = findAncestor(parentWrapper, RESULTSET_CLASS).querySelector(FILTER_DONE_BTN_SELECTOR),
                flowType = experienceHire ? "Experienced Professionals" : "S&G";
            filterLabel = filterLabel.indexOf("(") !== -1 ? filterLabel.slice(0, filterLabel.indexOf("(")).trim() : filterLabel;
            if (filterDoneBtn) {
                filterDoneBtn.setAttribute("data-analytics-link", "Careers Search Filter | " + flowType + " | " + filterLabel + " | Done");
                filterDoneBtn.setAttribute("data-analytics-button", "Careers Search Filter | " + flowType + " | " + filterLabel + " | Done");
            }
        });
    }

    var getJobQuery = getUrlParameter('opportunity');
    var getBusinessArea = getUrlParameter('businessarea');
    var getProgramType = getUrlParameter('programtype');
    var getEducationLevel = getUrlParameter('educationlevel');
    var getRegion = getUrlParameter('region');
    var getCountry = getUrlParameter('country');
    var getState = getUrlParameter('state');
    var getCity = getUrlParameter('city');
    opportunityValue = getJobQuery.toLowerCase();

    var loacationRegionValue = getRegion.split(',');
    var loacationCountryValue = getCountry.split(',');
    var loacationStateValue = getState.split(',');
    var loacationCityValue = getCity.split(',');
    let queryParamaters = {
        region: loacationRegionValue,
        country: loacationCountryValue,
        state: loacationStateValue,
        city: loacationCityValue
    };

    experienceHire = true;
    epBackButtonFlag = true;
    sgBackButtonFlag = true;
    if (opportunityValue === "ep") {
        var queryParamsValue = {
            'institutional-securities': 'CCH-10100',
            'operations': 'CCH-10200',
            'company': 'CCH-10300',
            'investment-management': 'CCH-10600',
            'wealth-management': 'CCH-10910',
            'firm-resilience-cyber-and-gic': 'CCH-92175',
            'technology': 'CCH-98100'
        };

        var getBAQueryParam = getBusinessArea.split(';');
        getBusinessArea = "";

        for (i = 0; i < getBAQueryParam.length; i++) {
            let convertValue = getBAQueryParam[i];
            getBusinessArea += queryParamsValue[convertValue] + ';';
        }
    }

    if (opportunityValue === "sg") {
        var sgQueryParamsValue = {
            'institutional-securities-group': 'Institutional Securities Group',
            'operations': 'Operations',
            'company': 'Company',
            'investment-management': 'Investment Management',
            'wealth-management': 'Wealth Management',
            'technology': 'Technology'
        };

        var getSGBAQueryParam = getBusinessArea.split(';');
        getBusinessArea = "";

        for (i = 0; i < getSGBAQueryParam.length; i++) {
            let convertValue = getSGBAQueryParam[i];
            getBusinessArea += sgQueryParamsValue[convertValue] + ';';
        }
    }

    function jobsPromptInitialize(getBusinessArea, getProgramType, getEducationLevel, loacationRegionValue, loacationCountryValue, loacationStateValue, loacationCityValue) {

        if (getBusinessArea || getProgramType || getEducationLevel || loacationRegionValue || loacationCountryValue || loacationStateValue || loacationCityValue) {
            $(".cmp-opportunity--findjobs").hide();

            $(".cmp-opportunity--filter--resultset").removeClass("slick--enabled");
            $(".cmp-opportunity--filter--resultset").prev().hide();
            $(".helpUs, .what--looking--title").hide();
            $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").show();
            $(".cmp-opportunity--filter--resultset").css("display", "-ms-grid").css("display", "grid");
            $(".cmp-opportunity--filter--resultset.studentsandgrads").hide();
            experienceHire = true;

            bindAccordioCheckBox();
            switchToProgram();

            var businessAreaValues = getBusinessArea.split(';');

            $.each(businessAreaValues, function (i, val) {
                $("input[value*='" + val + "']").click();
            });

            var programTypeValues = getProgramType.split(';');
            $.each(programTypeValues, function (i, val) {
                $("input[value*='" + val + "']").click();
            });

            var educationLevelValues = getEducationLevel.split(';');
            $.each(educationLevelValues, function (i, val) {
                $("input[value*='" + val + "']").click();

            });

            var getQueryParams = getSelectedValues();
            let collectedLoacations = getQueryParamaters(queryParamaters, 'sg');

            createRequestResultSet(getQueryParams + '&location=' + collectedLoacations);

        } else {
            opportunityValue = "ep";

            if (epBackButtonFlag) {
                $(".experienceHire .cmp-opportunity--filter__slick").on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {
                    var i = (currentSlide ? currentSlide : 0) + 1;
                    $(".careerTypesCount").text((i) + ' of ' + (slick.slideCount));

                    if (i == slick.slideCount) {
                        $(".doneButton").show();
                        $(".nextButton").hide();
                    } else {
                        //$(".nextButton").show();
                        $(".doneButton").hide();
                    }
                    if (i !== 1) {
                        $('.backButton').show().focus();
                    }
                    if (currentSlide == 1) {
                        $(".nextButton").show();
                    }
                });

                $(".experienceHire .cmp-opportunity--filter__slick").on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                    if (nextSlide == 0) {
                        // $(".experienceHire .cmp-opportunity--filter__slick").slick('unslick');
                        epBackButtonFlag = false;
                        $(".cmp-opportunity--filter--resultset.experienceHire.slick--enabled, .careerTypesCount, .nextButton, .backButton").hide();
                        $(".cmp-opportunity--quicksearch, .backButton").show();
                        $(".backButton").attr("data-analytics-button", "Career Opportunities | Back");
                        $(".helpUs, .what--looking--title").hide();
                    }
                });

                $(".cmp-opportunity--findjobs, .what--looking--title").hide();
                $(".cmp-opportunity--filter--resultset.experienceHire").css("display", "-ms-grid").css("display", "grid");
                $(".cmp-opportunity--filter--resultset.studentsandgrads").hide();
                $(".careerTypesCount, #careerWrapper, .nextButton").show();
                $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").hide();
                $(".cmp-opportunity--filter--resultset.experienceHire.slick--enabled").css("display", "grid");
                experienceHire = true;
                $(".experienceHire .cmp-opportunity--filter__slick").slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    speed: 500,
                    fade: true,
                    adaptiveHeight: false,
                    infinite: false,
                    arrows: false
                });
                if (!sgBackButtonFlag) {
                    var filterClass = ['div#slick-slide10, div#slick-slide11, div#slick-slide12'].join(',');
                } else {
                    var filterClass = ['div#slick-slide00, div#slick-slide01, div#slick-slide02'].join(',');
                }
                $(".experienceHire .cmp-opportunity--filter__slick").slick('slickFilter', filterClass);
                $(".experienceHire .cmp-opportunity--filter__slick").slick('slickGoTo', 1);
            } else {
                $(".cmp-opportunity--filter--resultset.experienceHire.slick--enabled, .careerTypesCount, .nextButton, .backButton").show();
                $(".cmp-opportunity--findjobs").hide();
                $(".cmp-opportunity--filter--resultset.experienceHire .cmp-opportunity--filter__slick").slick('slickGoTo', 1);
            }
        }

    }

    function internPromptInitialize(getBusinessArea, getProgramType, getEducationLevel, loacationRegionValue, loacationCountryValue, loacationStateValue, loacationCityValue) {

        if (getBusinessArea || getProgramType || getEducationLevel || loacationRegionValue || loacationCountryValue || loacationStateValue || loacationCityValue) {
            $(".cmp-opportunity--findjobs").hide();

            $(".cmp-opportunity--filter--resultset").removeClass("slick--enabled");
            $(".cmp-opportunity--filter--resultset").prev().hide();
            $(".helpUs, .what--looking--title").hide();
            $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").show();
            $(".cmp-opportunity--filter--resultset").css("display", "-ms-grid").css("display", "grid");
            $(".cmp-opportunity--filter--resultset.experienceHire").hide();
            $(".cmp-opportunity--filter--resultset.studentsandgrads").css("display", "grid");
            experienceHire = false;

            bindAccordioCheckBox();
            switchToProgram();

            var arrayValues = getBusinessArea.split(';');
            $.each(arrayValues, function (i, val) {
                if ($("input[value='" + val + "']").length > 1) {
                    $($("input[value='" + val + "']")[0]).click();
                } else {
                    $("input[value='" + val + "']").click();
                }

            });


            var programTypeValues = getProgramType.split(';');
            $.each(programTypeValues, function (i, val) {
                $("input[value*='" + val + "']").click();
            });

            var educationLevelValues = getEducationLevel.split(';');
            $.each(educationLevelValues, function (i, val) {
                $("input[value*='" + val + "']").click();

            });

            var getQueryParams = getSelectedValues();
            let collectedLoacations = getQueryParamaters(queryParamaters, 'ep');

            createRequestResultSet(getQueryParams + '&location=' + collectedLoacations);

        } else {
            opportunityValue = "sg";
            $(".what--looking--title").hide();

            if (sgBackButtonFlag) {
                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").on('init reInit afterChange', function (event, slick, currentSlide, nextSlide) {
                    var i = (currentSlide ? currentSlide : 0) + 1;
                    $(".careerTypesCount").text((i) + ' of ' + (slick.slideCount));

                    if (i == slick.slideCount) {
                        $(".doneButton").show();
                        $(".nextButton").hide();
                    } else {
                        $(".nextButton").show();
                        $(".doneButton").hide();
                    }
                    if (i !== 1) {
                        $('.backButton').show().focus();
                    }
                });

                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").on('beforeChange', function (event, slick, currentSlide, nextSlide) {
                    if (nextSlide == 0) {
                        // $(".studentsandgrads .cmp-opportunity--filter__slick").slick('unslick');
                        sgBackButtonFlag = false;
                        $(".cmp-opportunity--filter--resultset.studentsandgrads.slick--enabled, .careerTypesCount, .nextButton, .backButton").hide();
                        $(".cmp-opportunity--quicksearch, .backButton").show();
                        $(".backButton").attr("data-analytics-button", "Career Search Flow | S&G | Quick Search | Back");
                        $(".helpUs, .what--looking--title").hide();
                    }
                });

                $(".cmp-opportunity--findjobs").hide();
                $(".cmp-opportunity--filter--resultset.experienceHire").hide();
                $(".cmp-opportunity--filter--resultset.studentsandgrads").css("display", "-ms-grid").css("display", "grid");
                $(".careerTypesCount, #careerWrapper, .nextButton").show();
                $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").hide();
                $(".cmp-opportunity--filter--resultset.experienceHire.slick--enabled").hide();
                $(".cmp-opportunity--filter--resultset.studentsandgrads.slick--enabled").css("display", "grid");
                experienceHire = false;

                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    dots: true,
                    speed: 500,
                    fade: true,
                    adaptiveHeight: false,
                    infinite: false,
                    arrows: false
                });

                if (!epBackButtonFlag) {
                    var filterClassSg = ['div#slick-slide10, div#slick-slide11, div#slick-slide12, div#slick-slide13, div#slick-slide14'].join(',');
                } else {
                    var filterClassSg = ['div#slick-slide00, div#slick-slide01, div#slick-slide02, div#slick-slide03, div#slick-slide04'].join(',');
                }
                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").slick('slickFilter', filterClassSg);
                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").slick('slickGoTo', 1);
            } else {
                $(".cmp-opportunity--filter--resultset.studentsandgrads.slick--enabled, .careerTypesCount, .nextButton, .backButton").show();
                $(".cmp-opportunity--findjobs").hide();
                $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--filter__slick").slick('slickGoTo', 1);
            }
        }
    }

    switch (getJobQuery.toLowerCase()) {
        case 'ep':
            jobsPromptInitialize(getBusinessArea, getProgramType, getEducationLevel, loacationRegionValue, loacationCountryValue, loacationStateValue, loacationCityValue);
            break;
        case 'sg':
            internPromptInitialize(getBusinessArea, getProgramType, getEducationLevel, loacationRegionValue, loacationCountryValue, loacationStateValue, loacationCityValue);
            break;
    }


    //A11Y

    $(".clearSelection").on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode == 13 || event.keyCode == 27) {
            $(this).click().blur();
        }
    });

    $('.backButton').click(function (e) {
        e.preventDefault();
        if ($('.cmp-opportunity--quicksearch:visible').length == 1 && experienceHire) {
            $(".cmp-opportunity--quicksearch").hide();
            $(".what--looking--title, .helpUs").show();
            $(".cmp-opportunity--regionSelectors").show();
            return false;
            // initAnalyticsHandler();
        }
        if ($('.cmp-opportunity--quicksearch:visible').length == 1 && !experienceHire) {
            $(".cmp-opportunity--quicksearch").hide();
            $('.backButton').hide();
            $(".cmp-opportunity--findjobs, .what--looking--title, .helpUs").show();
            // initAnalyticsHandler();
        }
        if ($('.cmp-opportunity--regionSelectors:visible').length == 1) {
            $(".cmp-opportunity--regionSelectors").hide();
            $(".what--looking--title").html("What are you looking?");
            $('.backButton').hide();
            $(".cmp-opportunity--findjobs, .what--looking--title, .helpUs").show();
            // initAnalyticsHandler();
        }
        $(this).parent().find('.slick-slider').slick('slickPrev');
        initAnalyticsHandler();

    });

    $('.nextButton').click(function (e) {
        e.preventDefault();
        $(this).parent().find('.slick-slider').slick('slickNext');
        $('.backButton').show();
        initAnalyticsHandler();
    });


    $(".career-type-division li").click(function () {
        $(".career-type-division-level-1").show();
        let getItemIndex = $(this).index();
        $(this).parent().siblings(".career-type-division-level-1").children("ul").hide();
        $($(this).parent().siblings(".career-type-division-level-1").children("ul")[getItemIndex]).show();
        $('.career-type-division li').css("opacity", "1");
        $(this).siblings().css("opacity", "0.5");
    })

    $(".career-type li").click(function () {
        let getItemIndex = $(this).index();
        $("#careerWrapper").slick('slickGoTo', getItemIndex + 1);
    })


    //  $(".findJob").click(function(e) {
    $(".job-experience").click(function (e) {
        e.preventDefault();
        $(".cmp-opportunity--findjobs").hide();
        $(".what--looking--title").text("Where are you looking?");
        regionSelectorsSection("ep");
        //jobsPromptInitialize();
        //initAnalyticsHandler();
    });


    $(".intern-students").click(function (e) {
        e.preventDefault();
        $(".cmp-opportunity--findjobs").hide();
        quicksearchSeaction("sg");

        // internPromptInitialize();
        // initAnalyticsHandler();
    });


    function regionSelectorsSection(type) {
        $(".cmp-opportunity--regionSelectors").show();
        let backButton = document.querySelector(".backButton");
        let searchType = experienceHire ? "Experienced Professionals" : "S&G";
        $(".title-for").html();
        $(".backButton").show().focus();
        backButton.setAttribute("data-analytics-button", "Career Opportunities | " + backButton.textContent.trim());
    }

    $(".region-russiaChina").click(function (e) {
        e.preventDefault();
        $(".cmp-opportunity--regionSelectors").hide();
        quicksearchSeaction("ep");
    });


    // Quick search funtion
    function quicksearchSeaction(type) {
        let backButton = document.querySelector(".backButton");
        let searchType = experienceHire ? "Experienced Professionals" : "S&G";
        $(".title-for").html();
        $(".backButton").show().focus();
        $(".cmp-opportunity--quicksearch").show();
        $(".helpUs").hide();
        $(".what--looking--title").hide();
        $(".button--guidedsearch_ep, .button--guidedsearch_sg").hide();
        $(".button--quicksearch-sg, .button--quicksearch-ep").hide();
        if (type === "ep") {
            experienceHire = true;
            searchType = "Experienced Professionals";
            $(".title-for").html("Opportunities for Experienced Professionals.")
            $(".button--guidedsearch_ep, .button--quicksearch-ep").show();
        }
        if (type === "sg") {
            experienceHire = false;
            searchType = "S&G";
            $(".title-for").html("Opportunities for Student and Graduates.")
            $(".button--guidedsearch_sg, .button--quicksearch-sg").show();
        }
        backButton.setAttribute("data-analytics-button", "Career Search Flow | " + searchType + " | Quick Search | " + backButton.textContent.trim());
        $(".button--guidedsearch_ep").click(function (e) {
            $(".cmp-opportunity--quicksearch").hide();
            $(".helpUs").show();
            $(".what--looking--title").hide();
            e.preventDefault();
            jobsPromptInitialize();
            initAnalyticsHandler();
        })

        $(".button--guidedsearch_sg").click(function (e) {
            $(".cmp-opportunity--quicksearch").hide();
            $(".helpUs").show();
            $(".what--looking--title").hide();
            e.preventDefault();
            internPromptInitialize();
            initAnalyticsHandler();
        })
    }


    //Check the opprtunity and fetch result set
    if (experienceHire) {
        expHireResutSet();
    } else {
        studGrandsResutSet();
    }

    $('.cmp-opportunity--filter--resultset .resultsSort').click(function (e) {
        e.preventDefault();
        if ($(this).find('span').hasClass('sort-down')) {
            $(this).find('a').attr('aria-label', 'descending order by date')
        } else {
            $(this).find('a').attr('aria-label', 'ascending order by date')
        }
        $(this).find('span').toggleClass('sort-down');
        resultSet.resultSet.reverse();
        generateResult(resultSet, currentPage, enteredKeyword, "noautoselect");
    });


    $('.keyword-search-wrapper input').on('keyup', function (e) {
        var labelText = $(this).next('label');
        if (this.value !== '') {
            labelText.addClass("input-has-val");
            checkCharLength(this.value, e.which);
        } else {
            labelText.removeClass("input-has-val");
            checkCharLength(this.value, e.which);
        }
    })

    function checkCharLength(keyword, keyCode) {
        if ((keyword.length < 3 && keyCode == 13) || (keyword == '' && keyCode == 13)) {
            $(".keyword-search-err-msg").addClass('keyword-show-err').text("Please enter 3 or more characters");
            $(".keyword-search-err-msg").attr("aria-invalid", "true");
            $(".keyword-search-err-msg").attr("aria-hidden", "false");
            let errorMsgId = $(".keyword-search-err-msg").attr("id");
            $(".keyword-search-wrapper input").attr("aria-describedby", errorMsgId).addClass('keyword-show-err');
            $(".keyword-search-wrapper input").focus();
        } else {
            $(".keyword-search-wrapper input").removeClass('keyword-show-err').removeAttr("aria-describedby");
            $(".keyword-search-err-msg").removeClass('keyword-show-err');
            $(".keyword-search-err-msg").attr("aria-invalid", "false");
            $(".keyword-search-err-msg").attr("aria-hidden", "true");
            if (keyword.length > 2 && keyCode == 13) {
                $('.button--quicksearch').trigger("click");
            }
        }
    }

    $('.button--quicksearch').click(function (e) {
        e.preventDefault();
        enteredKeyword = $(".quicksearch input").val().trim();
        /* sanitize keyword for XSS attack */
        //enteredKeyword = enteredKeyword.replace(/[^\w\s]/gi, "");
        let format = /[!@#$%^&*()_+¬`£~%\-=\[\]{};':"\\|,.<>\/?]+/;

        if (format.test(enteredKeyword)) {
            $(".keyword-search-err-msg").addClass('keyword-show-err').text("Please enter alphanumeric keyword");
            $(".keyword-search-err-msg").attr("aria-invalid", "true");
            let errorMsgId = $(".keyword-search-err-msg").attr("id");
            $(".keyword-search-wrapper input").attr("aria-describedby", errorMsgId).addClass('keyword-show-err');
            $(".keyword-search-wrapper input").focus();
            return false;
        }

        if (enteredKeyword.length < 3) {
            $(".keyword-search-err-msg").addClass('keyword-show-err').text("Please enter 3 or more characters");
            $(".keyword-search-err-msg").attr("aria-invalid", "true");
            let errorMsgId = $(".keyword-search-err-msg").attr("id");
            $(".keyword-search-wrapper input").attr("aria-describedby", errorMsgId).addClass('keyword-show-err');
            $(".keyword-search-wrapper input").focus();
            return false;
        }

        onClickFetchResult(enteredKeyword);
    });

    $('.all--exp--link, .all--sg--link').click(function (e) {
        e.preventDefault();
        onClickFetchResult();
// Clear All Filters
        $(".accordion--filterby__clear").click();
        $(".cmp-opportunity--filter--resultset").removeClass("active");
        $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");

    });


    bindAccordioCheckBox();

});

function onClickFetchResult(keyword) {

    $(".cmp-opportunity--filter__slick.slick-initialized").slick('slickUnfilter');
    $(".cmp-opportunity--filter__slick.slick-initialized").slick('unslick');
    $(".cmp-opportunity--filter--resultset").removeClass("slick--enabled");
    $(".cmp-opportunity--filter--resultset").prev().hide();
    $(".helpUs, .what--looking--title, .cmp-opportunity--quicksearch").hide();
    $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").show();
    $(".nextButton, .doneButton").hide();
    if (window.innerWidth <= 1024) {
        $(".floatingMenu").show();
        $(".cmp-opportunity--filter__accordion").hide();
    }
    if (experienceHire) {
        $(".cmp-opportunity--filter--resultset.experienceHire").css("display", "-ms-grid").css("display", "grid");
        $(".cmp-opportunity--filter--resultset.studentsandgrads").hide();

        expHireResutSet();
        //   collectedParameterValues = '&opportunity=ep&lang=en';
        collectedParameterValues = $(".button--go").attr("results-parameter");
        createRequestResultSet(collectedParameterValues, keyword);

    } else {
        $(".cmp-opportunity--filter--resultset.experienceHire").hide();
        $(".cmp-opportunity--filter--resultset.studentsandgrads").css("display", "-ms-grid").css("display", "grid");
        studGrandsResutSet();

        collectedParameterValues = '&opportunity=sg&lang=en';
        createRequestResultSet(collectedParameterValues, keyword);
    }

    bindAccordioCheckBox();
    switchToProgram();

    // Clear All Filters
    $(".accordion--filterby__clear").click();
    $(".cmp-opportunity--filter--resultset").removeClass("active");
    $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");
}

function initAnalyticsHandler() {
    let searchType, activeSlick, filterLabel, resultSetParent, nextButton, backButton, doneButton, allButton;
    searchType = experienceHire ? "Experienced Professionals" : "S&G";
    activeSlick = document.querySelector(".cmp-opportunity--filter--resultset .slick-current.slick-active");
    filterLabel = activeSlick.querySelector("." + FILTER_LABEL_CLASS).textContent.split('(')[0].trim();
    resultSetParent = findAncestor(activeSlick, RESULTSET_CLASS);
    nextButton = resultSetParent.querySelector(".nextButton a");
    doneButton = resultSetParent.querySelector(".doneButton a");
    backButton = document.querySelector(".backButton");
    allButton = resultSetParent.querySelector(".all--sg--link");
    nextButton.setAttribute("data-analytics-button", "Career Search Flow | " + searchType + " | " + filterLabel + " | " + nextButton.textContent.trim());
    backButton.setAttribute("data-analytics-button", "Career Search Flow | " + searchType + " | " + filterLabel + " | " + backButton.textContent.trim());
    doneButton.setAttribute("data-analytics-button", "Career Search Flow | " + searchType + " | " + filterLabel + " | " + doneButton.textContent.trim());
    allButton.setAttribute("data-analytics-link", "Career Search Flow | " + searchType + " | " + filterLabel + " | " + allButton.textContent.trim());

}

function switchToProgram() {
    // Bind Click for switch to filter link
    $(".cmp-opportunity--filter--resultset.experienceHire .switchto__text").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".cmp-opportunity--filter--resultset.experienceHire .switchto__text").on('click', function () {
        // location.reload(false);
        let url_string = location.href;
        let findWcmode = url_string.search("wcmmode=disabled");
        let findQuerry = url_string.search("opportunity");
        let url_param = url_string.split('?');

        let newurl = url_param[0];
        if (findWcmode > -1) {
            newurl = newurl + '?wcmmode=disabled';
            location.href = newurl;
        } else {
            if (findQuerry > 11)
                location.href = newurl;
            else
                location.reload(false);
        }

        /* Switch to resultset
        clearAllFilterStudGrads(this);
        if(window.innerWidth < 1024) {
            $(".floatingMenu").toggleClass("topMenu");
            $(".cmp-opportunity--filter__accordion").hide();
            $(".resultsFound").show();
        }
        studGrandsResutSet();
        */
    });
    $(".cmp-opportunity--filter--resultset.studentsandgrads .switchto__text").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".cmp-opportunity--filter--resultset.studentsandgrads .switchto__text").on('click', function () {
        //  location.reload(false);

        let url_string = location.href;
        let findWcmode = url_string.search("wcmmode=disabled");
        let findQuerry = url_string.search("opportunity");
        let url_param = url_string.split('?');

        let newurl = url_param[0];
        if (findWcmode > -1) {
            newurl = newurl + '?wcmmode=disabled';
            location.href = newurl;
        } else {
            if (findQuerry > 11)
                location.href = newurl;
            else
                location.reload(false);
        }

        /* Switch to resultset
        clearAllFilterExpProf(this);
        if(window.innerWidth < 1024) {
            $(".floatingMenu").toggleClass("topMenu");
            $(".cmp-opportunity--filter__accordion").hide();
            $(".resultsFound").show();
        }
        expHireResutSet();
        */
    });


}

function expHireResutSet() {
    $(".experienceHire .filter--button--done").on('click', function (e) {
        e.preventDefault();
        opportunityValue = "ep";
        $(".accordion--header .accordion--arrow").removeClass("expand");
        $(".accordion--header").each(function (index) {
            let analyticsVal = $(this).attr("data-analytics-link");
            analyticsVal = analyticsVal.replace("Collapse", "Expand");
            $(this).attr("data-analytics-link", analyticsVal);
        });
        $(".accordion--filter--title").hide();
        $('.accordion--content').hide();
        $(".cmp-opportunity--filter--resultset").removeClass("active");
        $(".cmp-opportunity--filter--resultset.experienceHire .cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");

        let getLangSelection = $($(".experienceHire .accordion--jobslevel__filters li").find("input:checked")).val();
        if (getLangSelection === "FR") {
            $(".experienceHire .accordion--jobslevel__label").text("Emplois disponibles en: Francais");
        } else {
            $(".experienceHire .accordion--jobslevel__label").text("Jobs available in: English");
        }

        var getQueryParams = getSelectedValues();
        createRequestResultSet(getQueryParams);

        switchFloatingMenu();

    });
}

function studGrandsResutSet() {
    $(".studentsandgrads .filter--button--done").on('click', function (e) {
        e.preventDefault();
        opportunityValue = "sg";
        $(".accordion--header .accordion--arrow").removeClass("expand");
        $(".accordion--header").each(function (index) {
            let analyticsVal = $(this).attr("data-analytics-link");
            analyticsVal = analyticsVal.replace("Collapse", "Expand");
            $(this).attr("data-analytics-link", analyticsVal);
        });
        $('.accordion--content').hide();
        $(".accordion--filter--title").hide();
        $(".cmp-opportunity--filter--resultset").removeClass("active");
        $(".cmp-opportunity--filter--resultset.studentsandgrads .cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");

        let getLangSelection = $($(".studentsandgrads .accordion--jobslevel__filters li").find("input:checked")).val();
        if (getLangSelection === "FR") {
            $(".studentsandgrads .accordion--jobslevel__label").text("Emplois disponibles en: Francais");
        } else {
            $(".studentsandgrads .accordion--jobslevel__label").text("Jobs available in: English");
        }


        var getQueryParams = getSelectedValues();
        createRequestResultSet(getQueryParams);

        switchFloatingMenu();

    });
}

function switchFloatingMenu() {
    if (window.innerWidth <= 1024) {
        $(".cmp-opportunity--filter__accordion").hide();
        //$(".cmp-opportunity--result__set").toggle();
        //$(".resultsFound").toggle();
        //$(".resultsSort").toggle();
        $(".floatingMenu").toggleClass("topMenu");
    }
}

function clearAllFilterStudGrads(element) {
    idSelector = "sg";
    let resultSetParent = document.querySelector(".studentsandgrads"),
        filterParent = resultSetParent.querySelector("." + LOCATION_FILTER_CLASS);
    if (getActualLocationSelections(filterParent).length > 0) {
        if (window.innerWidth > 767) {
            clearAllSelections(filterParent);
            initLocationSet();
        } else clearAllMobileSelections(filterParent);
        filterParent.querySelector(".clearSelection").classList.add("disabled");
    }

    updateLocationCount(filterParent);

    collectedParameterValues = '&opportunity=sg&lang=en';
    experienceHire = false;
    createRequestResultSet(collectedParameterValues);

    $(".cmp-opportunity--filter--resultset.studentsandgrads").css("display", "-ms-grid").css("display", "grid");
    $(".cmp-opportunity--filter--resultset.experienceHire").hide();
    $(".accordion--filterby__clear").click();
    $(".cmp-opportunity--filter--resultset").removeClass("active");
    $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");
    $(".accordion--header .accordion--arrow").removeClass("expand");
    $('.accordion--content').hide();
    $(".accordion--jobslevel__label").text("Jobs available in: English");
    $(".accordion--jobslevel__filters .checkbox input#English").prop('checked', true)
    $(".accordion--jobslevel__filters .checkbox input#English-sg").prop('checked', true)

}

function clearAllFilterExpProf(element) {
    idSelector = "ep";
    let resultSetParent = document.querySelector(".experienceHire"),
        filterParent = resultSetParent.querySelector("." + LOCATION_FILTER_CLASS);
    if (getActualLocationSelections(filterParent).length > 0) {
        if (window.innerWidth > 767) {
            clearAllSelections(filterParent);
            initLocationSet();
        } else clearAllMobileSelections(filterParent);
        filterParent.querySelector(".clearSelection").classList.add("disabled");
    }
    updateLocationCount(filterParent);

    //collectedParameterValues = '&opportunity=ep&lang=en';
    collectedParameterValues = $(".button--go").attr("results-parameter");
    experienceHire = true;
    createRequestResultSet(collectedParameterValues);

    $(".cmp-opportunity--filter--resultset.studentsandgrads").hide();
    $(".cmp-opportunity--filter--resultset.experienceHire").css("display", "-ms-grid").css("display", "grid");
    $(".accordion--filterby__clear").click();
    $(".cmp-opportunity--filter--resultset").removeClass("active");
    $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");
    $(".accordion--header .accordion--arrow").removeClass("expand");
    $('.accordion--content').hide();
    $(".accordion--jobslevel__label").text("Jobs available in: English");
    $(".accordion--jobslevel__filters .checkbox input#English").prop('checked', true)
    $(".accordion--jobslevel__filters .checkbox input#English-sg").prop('checked', true)

}

function bindAccordioCheckBox() {

    $('.cmp-opportunity--filter__accordion .accordion--header').off('keyup').on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    });
    //Accordion click    
    $('.cmp-opportunity--filter__accordion .accordion--header').off('click').on('click', function (e) {
        $(".cmp-opportunity--filter--resultset").removeClass("active");
        $(".accordion--filter--title, .description_section").hide();
        $(".cmp-opportunity-aggregate .jobcard_arrow").removeClass("up").addClass("down");


        if ($(this).next().is(":visible")) {
            $(this).next().hide();
            $(this).find(".accordion--arrow").removeClass("expand");
            let analyticsVal = $(this).attr("data-analytics-link");
            analyticsVal = analyticsVal.replace("Collapse", "Expand");
            $(this).attr("data-analytics-link", analyticsVal);
            $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");
            return;
        }

        if ($(this).next().next().is(":visible")) {
            $(this).next().hide();
            $(this).next().next().hide();
            $(this).find(".accordion--arrow").removeClass("expand");
            let analyticsVal = $(this).attr("data-analytics-link");
            analyticsVal = analyticsVal.replace("Collapse", "Expand");
            $(this).attr("data-analytics-link", analyticsVal);
            $(".cmp-opportunity--result__set").addClass("cmp-opportunity--result__set--expand");
            return;
        }

        $('.accordion--content').hide();
        $(this).next().next().show();

        if ($(this).next().next().length == 0) {
            $(this).next().show();
        }

        $(this).find(".accordion--arrow").addClass("expand");
        let analyticsVal = $(this).attr("data-analytics-link");
        analyticsVal = analyticsVal.replace("Expand", "Collapse");
        $(this).attr("data-analytics-link", analyticsVal);
        $(".cmp-opportunity--filter--resultset").addClass("active")
        $(".cmp-opportunity--result__set").removeClass("cmp-opportunity--result__set--expand");

    });

    //Checkbox Validation
    $(".accordion--businessarea__wrapper .level_1 input").change(function () {
        var hasChild = $(this).parents(".has-child");
        if (this.checked == false) {
            $(this).parents(".level_1").siblings(".checkbox").find("input")[0].checked = false;
        }
        if ($(hasChild).find(".level_1 input:checked").length == $(hasChild).find(".level_1 input").length) {
            $(this).parents(".level_1").siblings(".checkbox").find("input")[0].checked = true;
        }
        if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
            $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
        } else {
            $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');
        }
        let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
        if (getSelectedLength > 0) {
            $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" + getSelectedLength + " Selected)");
        } else {
            $(".accordion--businessarea__wrapper .selected--checkbox").hide();
        }
    });

    $(".accordion--businessarea__wrapper .no-child input").change(function () {

        if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
            $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
        } else {
            $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');
        }
        let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
        if (getSelectedLength > 0) {
            $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" + getSelectedLength + " Selected)");
        } else {
            $(".accordion--businessarea__wrapper .selected--checkbox").hide();
        }
    });

    $(".accordion--businessarea__wrapper .has-child >div.checkbox input").change(function () {
        var status = this.checked;
        var childNodes = $(this).parents(".has-child").find(".level_1 input");
        $(childNodes).each(function () {
            this.checked = status
        });
        if ($(".accordion--businessarea__wrapper input:checked").length > 0) {
            $(".accordion--businessarea__wrapper .clearSelection").removeClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '0');
        } else {
            $(".accordion--businessarea__wrapper .clearSelection").addClass("disabled");
            $(".accordion--businessarea__wrapper .clearSelection").attr('tabindex', '-1');

        }

        let getSelectedLength = $('.accordion--businessarea__wrapper input[type=checkbox]:checked').length;
        if (getSelectedLength > 0) {
            $(".accordion--businessarea__wrapper .selected--checkbox").show().text(" (" + getSelectedLength + " Selected)");
        } else {
            $(".accordion--businessarea__wrapper .selected--checkbox").hide();
        }
    });
    $(".accordion--businessarea__wrapper .clearSelection").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".accordion--businessarea__wrapper .clearSelection").click(function () {
        $('.accordion--businessarea__wrapper input[type=checkbox]').prop('checked', false);
        $(this).addClass("disabled");
        $(this).attr("tabindex", "-1");
        $(".accordion--businessarea__wrapper .selected--checkbox").hide();

    });

    $(".accordion--programtype__wrapper div.checkbox input").change(function () {

        if ($(".accordion--programtype__wrapper input:checked").length > 0) {
            $(".accordion--programtype__wrapper .clearSelection").removeClass("disabled");
            $(".accordion--programtype__wrapper .clearSelection").attr('tabindex', '0');
        } else {
            $(".accordion--programtype__wrapper .clearSelection").addClass("disabled");
            $(".accordion--programtype__wrapper .clearSelection").attr('tabindex', '-1');
        }

        let getProgramSelectedLength = $('.accordion--programtype__wrapper input[type=checkbox]:checked').length;
        if (getProgramSelectedLength > 0) {
            $(".accordion--programtype__wrapper .selected--checkbox").show().text(" (" + getProgramSelectedLength + " Selected)");
        } else {
            $(".accordion--programtype__wrapper .selected--checkbox").hide();
        }
    });

    $(".accordion--programtype__wrapper .clearSelection").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".accordion--programtype__wrapper .clearSelection").click(function () {
        $('.accordion--programtype__wrapper input[type=checkbox]').prop('checked', false);
        $(this).addClass("disabled");
        $(this).attr("tabindex", "-1");
        $(".accordion--programtype__wrapper .selected--checkbox").hide();

    });

    $(".accordion--educationlevel__wrapper div.checkbox input").change(function () {

        if ($(".accordion--educationlevel__wrapper input:checked").length > 0) {
            $(".accordion--educationlevel__wrapper .clearSelection").removeClass("disabled");
            $(".accordion--educationlevel__wrapper .clearSelection").attr('tabindex', '0');
        } else {
            $(".accordion--educationlevel__wrapper .clearSelection").addClass("disabled");
            $(".accordion--educationlevel__wrapper .clearSelection").attr('tabindex', '-1');

        }

        let getEducatonSelectedLength = $('.accordion--educationlevel__wrapper input[type=checkbox]:checked').length;
        if (getEducatonSelectedLength > 0) {
            $(".accordion--educationlevel__wrapper .selected--checkbox").show().text(" (" + getEducatonSelectedLength + " Selected)");
        } else {
            $(".accordion--educationlevel__wrapper .selected--checkbox").hide();
        }
    });

    $(".accordion--educationlevel__wrapper .clearSelection").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".accordion--educationlevel__wrapper .clearSelection").click(function () {
        $('.accordion--educationlevel__wrapper input[type=checkbox]').prop('checked', false);
        $(this).addClass("disabled");
        $(this).attr("tabindex", "-1");
        $(".accordion--educationlevel__wrapper .selected--checkbox").hide();

    });


    // No results Clear all filters
    $(".button--noresults-clearall-ep").off().on('click', function (e) {
        e.preventDefault();
        clearAllFilterExpProf();
    });


    // No results Clear all filters
    $(".button--noresults-clearall-sg").off().on('click', function (e) {
        e.preventDefault();
        clearAllFilterStudGrads()
    });


    // Clear All Filters
    $(".cmp-opportunity--filter__accordion .accordion--filterby__clear").on('keyup', function (e) {
        if (e.keyCode === 13) {
            $(this).click();
        }
    })
    $(".cmp-opportunity--filter__accordion .accordion--filterby__clear").on('click', function (e) {
        e.preventDefault();
        // Clear locations
        $(this).attr('tabindex', '-1');
        let parent = findAncestor(e.target, RESULTSET_CLASS),
            locationFilterSec = parent.querySelector("." + LOCATION_FILTER_CLASS);
        if (getActualLocationSelections(locationFilterSec).length > 0) {
            if (window.innerWidth > 767) {
                clearAllSelections(locationFilterSec);
                initLocationSet();
            } else clearAllMobileSelections(locationFilterSec);
            updateLocationCount(locationFilterSec);
            locationFilterSec.querySelector(".clearSelection").classList.remove("disabled");
        }

        $('.cmp-opportunity--filter__accordion input[type=checkbox]').prop('checked', false);
        $(".accordion--jobslevel__label").text("Jobs available in: English");
        $(".accordion--jobslevel__filters .checkbox input#English").prop('checked', true)
        $(".accordion--jobslevel__filters .checkbox input#English-sg").prop('checked', true)

        $(this).addClass("disabled");
        $(".cmp-opportunity--filter__accordion .selected--checkbox").hide();
        $(".clearSelection").addClass("disabled");

        $(".cmp-opportunity--filter--resultset").addClass("active");
        $(".cmp-opportunity--result__set").removeClass("cmp-opportunity--result__set--expand");
    });

    $(".cmp-opportunity--filter__accordion div.checkbox input").change(function () {

        if ($(".cmp-opportunity--filter__accordion input:checked").length > 0) {
            $(".accordion--filterby__clear").removeClass("disabled");
            $(".accordion--filterby__clear").attr("tabindex", "0");
        } else {
            $(".accordion--educationlevel__wrapper .clearSelection").addClass("disabled");
        }
    });

}

// Create request for result set
function createRequestResultSet(collectedParameterValues, keyword) {
    var pageUrl = window.location.href;
    if (pageUrl.indexOf('career-opportunities-search') > -1) {
        var SERVLET_PATH = window.location.origin + "/web/career_services/webapp/service/careerservice/resultset.json?" + collectedParameterValues;
        // var SERVLET_PATH = "http://ivapp1186233.devin3.ms.com:2805/web/career_services/webapp/service/careerservice/resultset.json?"+collectedParameterValues;
        resultSet = fetchResultSet(SERVLET_PATH);
        if (resultSet) {
            if (keyword) {
                let filteredResultSet = resultSet;
                let filteredResultArray = searchKeyword(resultSet.resultSet, keyword);
                if (filteredResultArray.length > 0) {
                    filteredResultSet.resultSet = filteredResultArray;
                    filteredResultSet.totalResults = filteredResultArray.length;
                    generateResult(filteredResultSet, currentPage, keyword);
                } else {
                    SERVLET_PATH = SERVLET_PATH + '&location=' + keyword;
                    let resultSetNotfound = fetchResultSet(SERVLET_PATH);
                    if (resultSetNotfound)
                        generateResult(resultSetNotfound, currentPage, keyword);
                }
            } else {
                enteredKeyword = "";
                generateResult(resultSet, currentPage);
            }
            $(".cmp-opportunity--filter__slick input").attr('tabindex', '0');
            accessibilityLocation();
        }
        $(".backButton").hide();
    }
}

function searchKeyword(resultSetArray, keyword) {

    let filteredResult = resultSetArray.filter(function (item) {
        let flag = false;
        /*iterate through individual job(item) keys*/
        Object.keys(item).forEach(function (key, index) {
            /* return once the keyword found -  no need of iterate through all the key*/
            if (flag) {
                return;
            }
            //let ignoreKeyName = ignoreKeysArr.find(ignoreKey => ignoreKey===key);

            let ignoreKeyStatus = isIgnoreKey(key);

            /*check only for the key other than values in ignoreKeysArr*/
            if (!ignoreKeyStatus) {
                if (item[key] && (typeof item[key] == "string" || typeof item[key] == "number")) {
                    if ((item[key].toString().toLowerCase()).indexOf(keyword.toString().toLowerCase()) > -1) {
                        flag = true;
                        return;
                    }
                }
            }
        });
        return flag;
    })
    return filteredResult;
}

function isIgnoreKey(key) {
    const ignoreKeysArr = ["applicationDate", "sortingDate", "jobHtmlDescription", "jobDescription", "url", "learnMoreCta"];
    let result = false;
    ignoreKeysArr.forEach(function (ignoreKey) {
        if (ignoreKey === key) {
            result = true;
            return;
        }
    });
    return result;
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Populated selected checkbox values
function getSelectedValues() {
    var collectedValues = "";
    var childValues = "";
    var parentValues = "";
    var tempArray = [];

    function searchURL(nameKey, fillterdArray) {
        for (let i = 0; i < fillterdArray.length; i++) {
            if (fillterdArray[i].name.toLowerCase() === nameKey.toLowerCase()) {
                return fillterdArray[i].url;
            }
        }
    }

    if (experienceHire) {
        var getRegionParam = getUrlParameter('country').toLowerCase();
        locationJsonData = fetchDropdownJson("/content/dam/msdotcom/appdata/filter-metadata-location.json");
        if (getRegionParam) {
            let filterdArrayObj = locationJsonData.filter(item => item.open === "internal");
            var getCountrylength = getRegionParam.split(",");

            getCountrylength.forEach(function (key, index) {
                let getFiltterValue = searchURL(getCountrylength[index].toLowerCase(), filterdArrayObj);

                if (collectedValues == "") {
                    collectedValues = getFiltterValue;
                } else if (getFiltterValue != undefined) {
                    let getFirstQueryUrl = collectedValues.split("&")[2].split("=")[1];
                    let getSecondQueryUrl = getFiltterValue.split("&")[2].split("=")[1];
                    collectedValues = "&opportunity=ep&location=" + getFirstQueryUrl + ";" + getSecondQueryUrl + "&lang=EN";
                }
            });

            if (collectedValues === undefined) {
                collectedValues = "&opportunity=ep&lang=en&location=notfound";
            }

        } else if (opportunityValue == "ep") {
            let filterdArray = locationJsonData.filter(item => item.open === "internal");
            filterdArray.forEach(function (key, index) {
                if (collectedValues == "") {
                    collectedValues = key.url;
                } else {
                    let getFirstQueryUrl = collectedValues.split("&")[2].split("=")[1];
                    let getSecondQueryUrl = key.url.split("&")[2].split("=")[1];
                    collectedValues = "&opportunity=ep&location=" + getFirstQueryUrl + ";" + getSecondQueryUrl + "&lang=EN";
                }
            });
        }
    } else {
        collectedValues = '&opportunity=' + opportunityValue;
    }


    var regionQueryString = [];
    $("[data-region-name]").each(function (index, val) {

        var region = val.getAttribute("data-region-name");
        var hasChild = $(val).find(".location-dropdown");
        if (region && hasChild.length > 0) {

            $(hasChild).each(function (index, subLocation) {

                var country = $(subLocation).find("[name='country']") && $(subLocation).find("[name='country']").val().indexOf("select-any") != 0 ? "_" + $(subLocation).find("[name='country']").val() : ""
                var state = $(subLocation).find("[name='state']") && $(subLocation).find("[name='state']").val().indexOf("all") != 0 ? "_" + $(subLocation).find("[name='state']").val() : ""
                var city = $(subLocation).find("[name='city']") && $(subLocation).find("[name='city']").val().indexOf("all") != 0 ? ":" + $(subLocation).find("[name='city']").val() : ""

                if (country != "") {
                    if (country == "_all") {
                        country = "";
                    }
                    regionQueryString.push(region + country + state + city);
                }

            });
        }

    })

    if (regionQueryString.length > 0)
        collectedValues += "&location=" + regionQueryString.join(';');


    $(".accordion--businessarea__wrapper .has-child > div.checkbox input").each(function () {
        if (this.checked) {
            tempArray.push($(this).val());
            if (tempArray.length !== 0 && parentValues.indexOf("businessArea") > -1) {
                parentValues += ';' + tempArray.toString();
                tempArray = [];
            } else {
                parentValues += '&businessArea=' + tempArray.toString();
                tempArray = [];
            }
        } else {
            var childNodes = $(this).parents(".has-child").find(".level_1 input:checked");
            $(childNodes).each(function () {
                tempArray.push($(this).val());

                if (tempArray.length !== 0 && childValues.indexOf("division") > -1) {
                    childValues += ';' + tempArray.toString();
                    tempArray = [];
                } else if (tempArray.length !== 0) {
                    childValues += '&division=' + tempArray.toString();
                    tempArray = [];
                }
            });

        }

    })

    $(".accordion--businessarea__filters .no-child > div.checkbox input").each(function () {
        if (this.checked) {
            tempArray.push($(this).val());
            if (tempArray.length !== 0 && parentValues.indexOf("businessArea") > -1) {
                parentValues += ';' + tempArray.toString();
                tempArray = [];
            } else {
                parentValues += '&businessArea=' + tempArray.toString();
                tempArray = [];
            }
        }
    });

    if (parentValues.length > 0 || childValues.length > 0) {
        collectedValues += parentValues + childValues;
    }


    $($(".accordion--educationlevel__filters li").find("input:checked")).each(function () {
        tempArray.push($(this).val());
    })
    if (tempArray.length !== 0) {
        collectedValues += '&educationLevel=' + tempArray.join(";");
        tempArray = [];
    }

    $($(".accordion--programtype__filters li").find("input:checked")).each(function () {
        tempArray.push($(this).val());
    })
    if (tempArray.length !== 0) {
        collectedValues += '&empType=' + tempArray.join(";");
        tempArray = [];
    }


    if (experienceHire) {
        tempArray.push($($(".experienceHire .accordion--jobslevel__filters li").find("input:checked")).val());
    } else {
        tempArray.push($($(".studentsandgrads .accordion--jobslevel__filters li").find("input:checked")).val());
    }


    if (tempArray.length !== 0) {
        collectedValues += '&lang=' + tempArray.join(";");
        tempArray = [];
    }

    return collectedValues;

    console.log(window.location + '?' + collectedValues);
}
/*
 * Fetch Opportunity - Result Set
 */

const OPPORTUNITY_AGGREGATE_BTN_SELECTOR = ".cmp-opportunity-aggregate .button--done";
var resultData = {
    totalResults: 0
};
$(document).ready(function () {
    const oppAggComp = $(".cmp-opportunity-aggregate");
    if(oppAggComp == undefined && oppAggComp.length <=0 ){
        return;
    }
    $(window).resize(function () {
        if (window.innerWidth > 1024) {
            $(".floatingMenu").hide();
            $(".floatingMenu").removeClass("topMenu");
            $(".cmp-opportunity--filter__accordion").show();
            if (resultData.totalResults !== 0) {
                $(".cmp-opportunity--result__set").show();
                $(".resultsFound").show();
                $(".resultsSort").show();
            } else {
                $(".cmp-opportunity--result__set").hide();
            }
        } else {
            if (resultData.resultSet) {
                $(".floatingMenu").show();
                if ($(".floatingMenu").hasClass("topMenu")) {
                    $(".cmp-opportunity--filter__accordion").show();
                } else {
                    $(".cmp-opportunity--filter__accordion").hide();
                    $(".resultsFound").show();
                    if (resultData.totalResults !== 0) {
                        $(".resultsFound").show();
                        $(".resultsSort").show();
                    } else {
                        $(".resultsSort").hide();
                    }
                }
            }
        }


    });

    $(".opportunity-aggregate .floatingMenu .action-button").on("click", function () {
        $(".cmp-opportunity--filter__accordion").toggle();
        $(".cmp-opportunity--result__set").toggle();
        // $(".resultsFound").toggle();
        // $(".resultsSort").toggle();
        $(".floatingMenu").toggleClass("topMenu");
        $(this).blur();
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    });

    $(OPPORTUNITY_AGGREGATE_BTN_SELECTOR).on('click', function () {
        $(".cmp-opportunity--filter__slick.slick-initialized").slick('slickUnfilter');
        $(".cmp-opportunity--filter__slick.slick-initialized").slick('unslick');
        $(".cmp-opportunity--filter--resultset").removeClass("slick--enabled");
        $(".cmp-opportunity--filter--resultset").prev().hide();
        $(".helpUs, .what--looking--title, .nextButton").hide();
        if (window.innerWidth <= 1024) {
            $(".floatingMenu").show();
            $(".cmp-opportunity--filter__accordion").hide();
        }
        $(".accordion--filterby__wrapper, .accordion--joblevel__wrapper, .filter-done").show();
        if (experienceHire) {
            $(".cmp-opportunity--filter--resultset.experienceHire").show();
            $(".cmp-opportunity--filter--resultset.studentsandgrads").hide();
            expHireResutSet();

        } else {
            $(".cmp-opportunity--filter--resultset.experienceHire").hide();
            $(".cmp-opportunity--filter--resultset.studentsandgrads").show();
            studGrandsResutSet();

        }
        $(REMOVE_BUTTON_SELECTOR).on("click", deleteHandler);
        //$(".cmp-opportunity--filter--resultset").css("display","grid");
        bindAccordioCheckBox();
        switchToProgram();

        var getQueryParams = getSelectedValues();
        createRequestResultSet(getQueryParams);
    });


});


var global_var;

function fetchResultSet(jsonPath) {

    const oppAggComp = $(".cmp-opportunity-aggregate");
    if(oppAggComp == undefined && oppAggComp.length <=0 ){
        return;
    }
    let jsonData;
    $.ajax({
        type: "GET",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        url: jsonPath,
        async: false,
        contentType: 'text/plain',
        dataType: 'json',
        success: function (result) {
            jsonData = result;
        },
        failure: function (response) {
            console.log("failure: response: " + response);
        }
    });
    global_var = 1;
    return jsonData;
}

let currentPage = 1;
let options = {
    "records_per_page": 10
}

function selectFilterByOptionsByKeyword(keywordFilteredResultArr) {

    const businessAreaArr = [];
    const educationLevelArr = [];
    const programTypeArr = [];

    keywordFilteredResultArr.forEach(function (item) {

        if (item.businessArea) {
            if (businessAreaArr.indexOf(item.businessArea) == -1) {
                businessAreaArr.push(item.businessArea);
            }
        }
        if (item.educationLevel) {
            const splitArr = item.educationLevel.split(",");
            for (i = 0; i < splitArr.length; i++) {
                if (educationLevelArr.indexOf(splitArr[i]) == -1) {
                    educationLevelArr.push(splitArr[i]);
                }
            }

        }
        if (item.employmentType) {
            if (programTypeArr.indexOf(item.employmentType) == -1) {
                programTypeArr.push(item.employmentType);
            }
        }
    });

    let businessInputStart = experienceHire ? '.experienceHire .accordion--businessarea__filters input[name="' : '.studentsandgrads .accordion--businessarea__filters input[value="';
    let businessInputEnd = '"]';

    $.each(businessAreaArr, function (i, val) {
        if (experienceHire) {
            val = val.trim().toLowerCase().replace(" ", "-");
            $(businessInputStart + val + businessInputEnd).click();
        } else {
            if ($(businessInputStart + val + businessInputEnd).length > 1) {
                $(businessInputStart + val + businessInputEnd)[0].click();
            } else {
                $(businessInputStart + val + businessInputEnd).click();
            }
        }
    });

    let educationInputStart = '.accordion--educationlevel__filters input[value="';
    let educationInputEnd = '"]';

    $.each(educationLevelArr, function (i, val) {
        $(educationInputStart + val + educationInputEnd).click();
    });

    let programInputStart = experienceHire ? '.experienceHire .accordion--programtype__filters input[value="' : '.studentsandgrads .accordion--programtype__filters input[value="';
    let programInputEnd = '"]';

    $.each(programTypeArr, function (i, val) {
        $(programInputStart + val + programInputEnd).click();
    });

}

var pagefunc = Pagination('opportunityPagination');

function generateResult(resultSet, currentPage, keyword, noautoselect) {

    $(".cmp-opportunity--result__set, .noreuslt--jobcard").empty();

    resultData = resultSet;
    let results = resultSet.resultSet;

    if (global_var == 1) {
        let results = resultSet.resultSet.reverse();
        global_var = 2;
        if ($('.sort-down:visible').length > 0) {
            $('.sort-down').css({'transform': 'rotate(223deg)'});
            $('.sort-down').css({'margin-bottom': '0px'});
            global_var = 3;
        }
    } else if (global_var == 3) {
        if ($('.sort-down:visible').length > 0) {
            $('.sort-down').css({'transform': 'rotate(223deg)'});
        } else {
            $('.sort-up').css({'transform': 'rotate(45deg)'});
        }
    }

    totalResultsFound = resultSet.resultSet.length;
    let showresultSet = paginationOpportunity(results, currentPage, options);
    for (let i = 0; i < showresultSet.length; i++) {
        let data = showresultSet[i];
        if (data != undefined) {
            if (resultSet.totalResults > 0) {
                $(".cmp-opportunity--result__set").append(getResultsDiv(data));
                $(".cmp-opportunity--result__set").show();
                $(".resultsSort").show();
                $(".no-results-found ").hide();
                newWindowLinks();
            } else {
                $(".no-results-found ").show();
                $(".resultsSort").hide();
                $(".cmp-opportunity--result__set").hide();
                $(".no-results-found .noreuslt--jobcard").append(getNoResultsDiv(i, showresultSet));
            }
            $(".resultsFound").text(resultSet.totalResults + " Results Found");
            if (keyword) {
                $(".resultsFound").text(resultSet.totalResults + " Results Found For ");
                $(".resultsFound").append('<span>"' + keyword + '"</span>');
            }

        }
    }

    if (experienceHire) {
        $(".experienceHire .cmp-opportunity--result__set").append("<div class='opportunity pagination' id='pagination'></div>");
    } else {
        $(".studentsandgrads .cmp-opportunity--result__set").append("<div class='opportunity pagination' id='pagination'></div>");
    }

    let pages = Math.ceil(resultSet.resultSet.length / options.records_per_page);

    pagefunc.Init(document.getElementById('pagination'), {
        size: pages, // pages size
        page: currentPage,  // selected page
        step: 1,   // pages before and after current
        results: resultSet, // data to show
        changedata: generateResult, // call back function for data change
        class: 'opportunity'
    });


    if (keyword && resultSet.totalResults > 0 && noautoselect !== "noautoselect") {
        setTimeout(function () {
            selectFilterByOptionsByKeyword(resultSet.resultSet);
        }, 1500);
    }

    $(".cmp-opportunity--result__set .cmp-jobcard__link").on("click", function () {
        if (window.innerWidth < 767) {
            if (experienceHire) {
                let url = $(this).find(".button--done").attr("href");
                window.open(url);
            } else {
                let url = $(this).find(".learn-more").attr("href");
                window.open(url);
            }

        }
    });

    $(".cmp-opportunity-aggregate .jobcard_arrow").click(function () {
        $(this).blur();
        let parentDiv = this.parentElement,
            analyticsVal = this.getAttribute("data-analytics-link");

        if ($(this).hasClass('down')) {
            $(this).removeClass('down').addClass('up');
            if (analyticsVal) $(this).attr("data-analytics-link", analyticsVal.replace("Expand", "Collapse"));

        } else {
            $(this).removeClass('up').addClass('down');
            if (analyticsVal) $(this).attr("data-analytics-link", analyticsVal.replace("Collapse", "Expand"));
        }

        $(parentDiv).find('.description_section').toggle();
    });

    $(".cmp-opportunity-aggregate .jobcard_arrow").on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;
        event.preventDefault();
        if (keyCode == 13 || event.keyCode == 27) {
            $(this).click().blur();
            $(".btn.learn-more").focus();
        }
        if (keyCode == 9) {
            $(this).blur();
        }

    });


    let scrollUp = 320;
    if (window.innerWidth < 767) {
        scrollUp = 220;
    } else if (window.innerWidth < 1025) {
        scrollUp = 250;
    }
    window.scrollTo({
        top: scrollUp,
        left: 0,
        behavior: 'smooth'
    });

    if (window.innerWidth <= 1024) {
        $(".floatingMenu").show();
        $(".cmp-opportunity--filter__accordion").hide();
    }
}

/**
 * Truncate the string on given number of character of the first line break.
 * @param { string to truncate} str
 * @param { number of character} count
 */
function ellipsify(str, count) {
    if (str) {
        // let patt1 = /\n/;
        // let index = str.search(patt1);
        // if(index !== -1 && index <= count) {
        //     count = index - 1;
        // }
        if (str.length > count) {
            return (str.substring(0, count) + "...");
        } else {
            return str;
        }
    }
}


function getResultsDiv(data) {
    let empType = data.opportunity == "EXPERIENCED PROFESSIONALS" ? "Job" : "Program";
    var dataLocation = data.location == null ? "" : data.location.replace("Korea, Republic of", "Republic of Korea");
    var typeOfEvent = experienceHire ? "Employment Type" : "Program Type";
    var appPostDate = experienceHire ? "Posted Date" : "Application Deadline";
    let flowType = experienceHire ? "EP" : "S&G";
    let descripton = data.jobDescription;

    let jobsType = experienceHire ? "ep." : "sg.";

    var url = window.location.href;
    var arr = url.split("/");
    var contextPath = '/' + arr[3];
    var origin = window.location.origin;
    var careerUrl = '';
    if (experienceHire) {
        careerUrl = data.url;
    } else {
        if (arr[3] === 'auth' || arr[3] === 'pub' || arr[3] === 'content') {
            careerUrl = origin + contextPath + '/msdotcom/en/careers/students-graduates/opportunities.' + data.jobNumber + '.html?wcmmode=disabled';
        } else {
            careerUrl = origin + '/careers/students-graduates/opportunities/' + data.jobNumber;
        }
    }
    if (navigator.userAgent.search("MSBrowserIE") !== -1) {
        descripton = ellipsify(data.jobDescription, 300)
    }

    if (window.innerWidth < 767) {

        let childDiv = "<div class='jobcard'>" +
            "<div class='cmp-jobcard'>" +
            '<div class="cmp-jobcard__link" ' +
            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Apply Now"' +
            'data-analytics-module="Opportunity Card | ' + data.jobTitle + ' | NA"' +
            'data-analytics-job-card="' + flowType + ' | ' + data.jobTitle + ' | ' + dataLocation + ' | ' + data.businessArea + ' | ' + data.employmentType + ' | ' + data.jobNumber + '"' +
            'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Apply Now"' +
            'data-analytics-job-url="' + data.url + ' ">' +
            '<div class="cmp-jobcard__content">' +
            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">' + data.opportunity + '</div>' +
            '<div class="cmp-jobcard__title">' + data.jobTitle + '</div>' +
            '<div class="cmp-jobcard__separator purple"></div></div>' +
            '<div class="description_section " style="display: none" >' +
            '<div>' + appPostDate + ': ' + data.applicationDate + '</div>' +
            '<div>' + typeOfEvent + ': ' + data.employmentType + '</div>' +
            '<div class="apply_button"><a class="button--done" ' +
            'href="' + data.url + '" target="_blank">Apply Now</a></div>' +
            // '<h4>'+empType+' Description </h4>' +
            // '<div class="description_text">' + data.jobDescription + '</div>' +
            '<div class="CTA-button"><a class="btn learn-more"' +
            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Learn More"' +
            'data-analytics-module="Opportunity Card | ' + data.jobTitle + ' | NA"' +
            'data-analytics-job-card="' + flowType + ' | ' + data.jobTitle + ' | ' + dataLocation + ' | ' + data.businessArea + ' | ' + data.employmentType + ' | ' + data.jobNumber + '"' +
            'href="' + careerUrl + '" target="_blank">Learn More</a> </div></div>' +
            '<div class="role_city_section"><div class="cmp-jobcard__role">' + data.businessArea + '</div>' +
            '<div class="cmp-jobcard__location">' + dataLocation + '</div>' +
            '<div class="jobId"> Job # ' + data.jobNumber + '</div></div>' +
            '<div class="jobcard_arrow down" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Expand"></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        return childDiv;

    } else {
        let childDiv = "<div class='jobcard'>" +
            "<div class='cmp-jobcard'>" +
            '<div class="cmp-jobcard__link" >' +
            '<div class="cmp-jobcard__content">' +
            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">' + data.opportunity + '</div>' +
            '<div class="cmp-jobcard__title">' + data.jobTitle + '</div>' +
            '<div class="cmp-jobcard__separator purple"></div></div>' +

            '<div class="role_city_section"><div class="cmp-jobcard__role">' + data.businessArea + '</div>' +
            '<div class="cmp-jobcard__location">' + dataLocation + '</div>' +
            '<div class="jobId"> Job # ' + data.jobNumber + '</div></div>' +
            '<div class="apply_button"><a class="button--done" ' +
            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Apply Now"' +
            'data-analytics-module="Opportunity Card | ' + data.jobTitle + ' | NA"' +
            'data-analytics-job-card="' + flowType + ' | ' + data.jobTitle + ' | ' + dataLocation + ' | ' + data.businessArea + ' | ' + data.employmentType + ' | ' + data.jobNumber + '"' +
            'data-analytics-button-cta="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Apply Now"' +
            'href="' + data.url + '" target="_blank">Apply Now</a></div>' +
            '<div class="jobcard_arrow down"  tabindex="0" data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Expand"></div>' +
            '<div class="application-date">' + appPostDate + ': ' + data.applicationDate + '</div>' +
            '<div class="typeof-event">' + typeOfEvent + ': ' + data.employmentType + '</div>' +
            '<div class="description_section " style="display: none" >' +
            '<h4>' + empType + ' Description </h4>' +
            '<div class="description_text">' + descripton + '</div>' +
            '<div class="CTA-button"><a class="btn learn-more" tabindex="0" ' +
            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | Learn More"' +
            'data-analytics-module="Opportunity Card | ' + data.jobTitle + ' | NA"' +
            'data-analytics-job-card="' + flowType + ' | ' + data.jobTitle + ' | ' + dataLocation + ' | ' + data.businessArea + ' | ' + data.employmentType + ' | ' + data.jobNumber + '"' +
            'href="' + careerUrl + '" target="_blank">Learn More</a> </div></div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
        return childDiv;
    }
}

function getNoResultsDiv(index, showResultSet) {
    let data = showResultSet[index], count = 0;
    var getLangSelection;
    for (let i = 0; i < showResultSet.length; i++) {
        if (showResultSet[i]) count++;
    }
    if (experienceHire) {
        getLangSelection = $($(".experienceHire .accordion--jobslevel__filters li").find("input:checked")).val();
    } else {
        getLangSelection = $($(".studentsandgrads .accordion--jobslevel__filters li").find("input:checked")).val();
    }
    if (getLangSelection === "FR") {
        $(".noresults-description").text("Il n’y a présentement aucune opportunité qui réponde à ce critère. Veuillez choisir de nouveaux filtres afin d’obtenir de nouveaux résultats");
    } else {
        $(".noresults-description").text("There are currently no opportunities open. Please choose other filters to see different results.");
    }
    var dataLocation = data.location == null ? "" : data.location.replace("Korea, Republic of", "Republic of Korea");
    var typeOfEvent = experienceHire ? "Employment Type" : "Program Type";
    var appPostDate = experienceHire ? "Posted Date" : "Application Deadline";
    let flowType = experienceHire ? "EP" : "S&G",
        childDiv = "<div class='jobcard'>" +
            "<div class='cmp-jobcard'>" +
            '<a class="cmp-jobcard__link" href="' + data.url + '" target="_blank"' +
            'data-analytics-link="' + capitalizeString(data.opportunity) + ' | ' + data.jobTitle + ' | NA"' +
            'data-analytics-module="Compact Opportunity Card | ' + data.jobTitle + ' | position ' + (index + 1) + ' of ' + count + '"' +
            'data-analytics-job-card="' + flowType + ' | ' + data.jobTitle + ' | ' + dataLocation + ' | ' + data.businessArea + ' | NA | NA">' +
            '<div class="cmp-jobcard__content">' +
            '<div class="eyebrow_title_section"><div class="cmp-jobcard__eyebrow">' + data.opportunity + '</div>' +
            '<div class="cmp-jobcard__title">' + data.jobTitle + '</div>' +
            '<div class="cmp-jobcard__separator purple"></div></div>' +
            '<div class="description_section " style="display: none" >' +
            '<div>' + appPostDate + ': ' + data.applicationDate + '</div>' +
            '<div>' + typeOfEvent + ': ' + data.employmentType + '</div>' +
            //  '<h4>Job Description </h4>' +
            //  '<div class="description_text">' + data.jobDescription + '</div>' +
            '<div class="CTA-button"><span class="btn learn-more">Learn More</span> </div></div>' +
            '<div class="role_city_section"><div class="cmp-jobcard__role">' + data.businessArea + '</div>' +
            '<div class="cmp-jobcard__location">' + dataLocation + '</div>' +
            '<div class="jobId"> Job # ' + data.jobNumber + '</div></div>' +
            '<div class="apply_button"><span class="button--done">Apply Now</span></div>' +
            '<div class="jobcard_arrow down"></div>' +
            '</div>' +
            '</a>' +
            '</div>' +
            '</div>';
    return childDiv;
}

/**
 * Finds out the ancestor of the current element based on the class name
 * @param {*Current element} el
 * @param {*Ancestor className} cls
 */
function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
}

/**
 * paginationating the data
 * @param {*Which page data to show} currentPage
 * @param {* other parameters} options
 */
function paginationOpportunity(data, currentPage, options) {
    let newArray = [];
    for (let i = (currentPage - 1) * options.records_per_page; i < (currentPage * options.records_per_page); i++) {
        newArray.push(data[i]);
    }
    return newArray;
}



var LOCATION_FILTER_PATH = "/content/dam/msdotcom/appdata/",
    OPPORTUNITY_AGGREGATE_CLASS = "cmp-opportunity-aggregate",
    EVENTS_AGGREGATE_CLASS = "cmp-events-aggregate",
    LOCATION_FILTER_CLASS = "accordion--location__filters",
    RESULTSET_CLASS = "cmp-opportunity--filter--resultset",
    EP_UL_CLASS_SELECTOR = ".experienceHire .location-selection-section",
    SG_UL_CLASS_SELECTOR = ".studentsandgrads .location-selection-section",
    EVENTS_UL_CLASS_SELECTOR = '.events .location-selection-section',
    EP_BUTTON_SELECTOR = ".job-experience a",
    SG_BUTTON_SELECTOR = ".intern-students a",
    PARENT_CLEAR_SELECTION_CLASS = "clearSelection",
    LOCATION_LABEL_CLASS = "accordion--location__label",
    CLEAR_ALL_BUTTON_CLASS = "accordion--filterby__clear",
    FILTER_DONE_BTN_SELECTOR = ".filter-done a",
    idSelector, locationSelectionSec, regions, parentEl, regionData, regionSelection, clearSelectionBtn, addButton;
var addLocationBoolean = false;


$(document).ready(function () {
    const oppAggComp = $(".cmp-opportunity-aggregate");
    if(oppAggComp == undefined && oppAggComp.length <=0 ){
        return;
    }
    $(EP_BUTTON_SELECTOR).on("click", function () {
        idSelector = "ep";
        regionData = false;
        LOCATION_FILTER_PATH = "/content/dam/msdotcom/appdata/";
        if (epBackButtonFlag) {
            //initLocationSet();
            loadEPLocation();
        }
    });

    $(SG_BUTTON_SELECTOR).on("click", function () {
        idSelector = "sg";
        regionData = false;
        LOCATION_FILTER_PATH = "/content/dam/msdotcom/appdata/";
        if (sgBackButtonFlag) {
            initLocationSet();
        }
    });


    let url_string = location.href;
    // let  url = new URL(url_string);
    // let selector = url.searchParams.get("opportunity");
    // if(selector) {
    //     idSelector = selector;
    //     initLocationSet();
    // }

    let findep = url_string.search('=ep');
    let findsg = url_string.search('=sg');
    if (findep > -1) {
        idSelector = "ep";
        initLocationSet();
    } else if (findsg > -1) {
        idSelector = "sg";
        initLocationSet();
    } else {
        idSelector = "events";
        initLocationSet();
    }
    let intialWindowWidth = window.innerWidth;
    $(window).resize(function () {
        if (window.innerWidth >= 768 && intialWindowWidth < 768) {
            locationFilterAlignment(0, idSelector, true)
        }
        if (intialWindowWidth >= 768 && window.innerWidth < 768) {
            locationFilterAlignment(0, idSelector, true)
        }
        intialWindowWidth = window.innerWidth;
    });

    $(".button--jobExperience, .button--internStudents").on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;
        if (keyCode == 13 || event.keyCode == 27) {
            $('.backButton').focus();
        }
    });

    $(".backButton").on('keydown', function (event) {
        var keyCode = event.keyCode || event.which;

        if (keyCode == 9 && (!event.shiftKey)) {
            event.preventDefault();
            $(this).blur();
            $(".slick-dots .slick-active").focus();
            $(".region-list .region-item").attr("tabindex", "-1");
            $(".region-list .region-item.active").focus().attr("tabindex", "0");
        }
        if (keyCode == 13 || event.keyCode == 27) {
            $(this).click();
        }
    });

});

/**
 * for mobile version location fliter reodering
 */

function locationFilterAlignment(type, idSelector) {
    if (window.innerWidth < 767) {
        $("#" + idSelector + "-clear-selection").appendTo(".region-item.active");
        if (type !== 1) {
            $("#" + idSelector + "-region-0").appendTo("#region-item-0");
            $("#" + idSelector + "-region-1").appendTo("#region-item-1");
            $("#" + idSelector + "-region-2").appendTo("#region-item-2");
            $("#" + idSelector + "-region-3").appendTo("#region-item-3");
        }
        $("#" + idSelector + "-add-location").appendTo(".region-item.active");
    } else {
        $("#" + idSelector + "-regions").before($("#" + idSelector + "-clear-selection"));
        $("#" + idSelector + "-regions").after($("#" + idSelector + "-add-location"));
        $("#" + idSelector + "-regions").after($("#" + idSelector + "-region-0"));
        $("#" + idSelector + "-regions").after($("#" + idSelector + "-region-1"));
        $("#" + idSelector + "-regions").after($("#" + idSelector + "-region-2"));
        $("#" + idSelector + "-regions").after($("#" + idSelector + "-region-3"));

        let activeId = $(".region-list .region-item.active").attr('id');
        if (activeId) {
            let indexs = activeId.split("-");
            let index = indexs[indexs.length - 1];
            $("#" + idSelector + "-region-" + index).show();
            $("#region-item-" + index).addClass("active");
        } else {
            $("#" + idSelector + "-clear-selection").show();
            $("#" + idSelector + "-region-0").show();
            $("#region-item-0").addClass("active");
            $("#" + idSelector + "-add-location").show();
        }
    }
}

/*accessability code*/
function accessibilityLocation() {
    $(".region-item").keydown(function (e) {
        if (e.keyCode == 40) {
            var selected = $('.region-item:focus').index();
            var totalLength = $(' .region-item').length;

            if (selected === totalLength - 1) {
                return
            }
            var next = selected + 1;
            var pre = selected - 1;
            if (pre < 0)
                pre = 0;
            if (next > $(' .region-item').length)
                next = $(' .region-item').length;


            let that = $(' .region-item').eq(next).focus();
            let regionName = $(that).attr("value"),
                filterParent = findAncestor(this, LOCATION_FILTER_CLASS),
                targetRegion = filterParent.querySelector("[data-region-name='" + regionName + "']");
            if (targetRegion && getActualLocationSelections(targetRegion).length > 0) {

                enableClearSelections(targetRegion);
            } else clearSelectionBtn.classList.add("disabled");
            let regionIndex = $(regions).index(that);
            if (window.innerWidth < 767)
                if ($(that).hasClass("active")) {
                    $(that).removeClass("active");
                    $(that).attr('tabindex', -1);
                    regionSelection = that.getAttribute("value");
                    //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
                    if (idSelector === "ep") {
                        hideAllSelections(EP_UL_CLASS_SELECTOR)
                    } else if (idSelector === "sg") {
                        hideAllSelections(SG_UL_CLASS_SELECTOR);
                    } else {
                        hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
                    }
                    let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
                    let clearButton = document.getElementById(idSelector + "-clear-selection");
                    let addButton = document.getElementById(idSelector + "-add-location");
                    if (targetRegionDdSec) {
                        targetRegionDdSec.style.display = "none";
                        // locationFilterAlignment(1, idSelector);
                    }
                    if (clearButton && addButton) {
                        addButton.style.display = "none";
                        clearButton.style.display = "none";
                    }
                    return;
                }
            $("#" + idSelector + "-regions .region-item").removeClass("active");
            $("#" + idSelector + "-regions .region-item").attr('tabindex', -1);
            $(that).addClass("active");
            $(that).attr('tabindex', 0);
            //  regionSelection = that.getAttribute("value");
            regionSelection = $(that).attr("value");
            //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
            if (idSelector === "ep") {
                hideAllSelections(EP_UL_CLASS_SELECTOR)
            } else if (idSelector === "sg") {
                hideAllSelections(SG_UL_CLASS_SELECTOR);
            } else {
                hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
            }
            let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
            let clearButton = document.getElementById(idSelector + "-clear-selection");
            let addButton = document.getElementById(idSelector + "-add-location");
            if (clearButton && addButton) {
                addButton.style.display = "block";
                clearButton.style.display = "block";
            }
            if (targetRegionDdSec) {
                targetRegionDdSec.style.display = "block";
                locationFilterAlignment(1, idSelector);

            } else createNewRegionSelctionSec(regionIndex, regionSelection);

        }


        if (e.keyCode == 38) {
            var selected = $(' .region-item:focus').index();

            var next = selected + 1;
            var pre = selected - 1;
            if (pre < 0)
                pre = 0;
            if (next > $(' .region-item').length)
                next = $(' .region-item').length;


            let that = $('  .region-item').eq(pre).focus();
            let regionName = $(that).attr("value"),
                filterParent = findAncestor(this, LOCATION_FILTER_CLASS),
                targetRegion = filterParent.querySelector("[data-region-name='" + regionName + "']");
            if (targetRegion && getActualLocationSelections(targetRegion).length > 0) {
                enableClearSelections(targetRegion);
            } else clearSelectionBtn.classList.add("disabled");
            let regionIndex = $(regions).index(that);
            if (window.innerWidth < 767)
                if ($(that).hasClass("active")) {
                    $(that).removeClass("active");
                    $(that).attr('tabindex', -1);
                    regionSelection = that.getAttribute("value");
                    //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
                    if (idSelector === "ep") {
                        hideAllSelections(EP_UL_CLASS_SELECTOR)
                    } else if (idSelector === "sg") {
                        hideAllSelections(SG_UL_CLASS_SELECTOR);
                    } else {
                        hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
                    }
                    let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
                    let clearButton = document.getElementById(idSelector + "-clear-selection");
                    let addButton = document.getElementById(idSelector + "-add-location");
                    if (targetRegionDdSec) {
                        targetRegionDdSec.style.display = "none";
                        // locationFilterAlignment(1, idSelector);
                    }
                    if (clearButton && addButton) {
                        addButton.style.display = "none";
                        clearButton.style.display = "none";
                    }
                    return;
                }
            $("#" + idSelector + "-regions .region-item").removeClass("active");
            $("#" + idSelector + "-regions .region-item").attr('tabindex', -1);
            $(that).addClass("active");
            $(that).attr('tabindex', 0);
            //  regionSelection = that.getAttribute("value");
            regionSelection = $(that).attr("value");
            //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
            if (idSelector === "ep") {
                hideAllSelections(EP_UL_CLASS_SELECTOR)
            } else if (idSelector === "sg") {
                hideAllSelections(SG_UL_CLASS_SELECTOR);
            } else {
                hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
            }
            let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
            let clearButton = document.getElementById(idSelector + "-clear-selection");
            let addButton = document.getElementById(idSelector + "-add-location");
            if (clearButton && addButton) {
                addButton.style.display = "block";
                clearButton.style.display = "block";
            }
            if (targetRegionDdSec) {
                targetRegionDdSec.style.display = "block";
                locationFilterAlignment(1, idSelector);

            } else createNewRegionSelctionSec(regionIndex, regionSelection);

        }

    });
}

function loadEPLocation() {
    LOCATION_FILTER_PATH += 'filter-metadata-location.json';
    // LOCATION_FILTER_PATH += 'filter-metadata-'+idSelector+'.json';
    locationData = fetchDropdownJson(LOCATION_FILTER_PATH);

    var epLocationDropDown = $(".ep-dropdown-location");
    if (!addLocationBoolean) {
        $.each(locationData, function (key, value) {
            epLocationDropDown.append($('<option>', {
                value: value.name,
                text: value.text,
                'data-url': value.url,
                'data-linkopen': value.open
            }));
        });
    }
    addLocationBoolean = true;
}

function updateResults() {
    var selectLocation = $(".ep-dropdown-location");
    var selectGoBtn = $(".button--go");
    var getSelIndex = selectLocation[0].options.selectedIndex;
    var getSelLocation = selectLocation[0].options[getSelIndex].innerText;
    if (getSelIndex == 0) {
        selectGoBtn.off();
        selectGoBtn.addClass("disabled");
        selectGoBtn.attr("href", "javascript:void(0);")
        selectGoBtn.removeAttr("target");
    } else {
        selectGoBtn.removeClass("disabled");
        selectGoBtn.attr("data-analytics-link", "In-Line Career Finder | Select Location | " + getSelLocation + " | Go");
        selectLocation.attr("data-analytics-dropdown", "In-Line Career Finder | Dropdown | Select Location | " + getSelLocation);
        var getLinkOpen = selectLocation[0].options[getSelIndex].dataset.linkopen;
        if (getLinkOpen === "external") {
            selectGoBtn.off("click");
            selectGoBtn.removeAttr("results-parameter");
            selectGoBtn.attr("href", selectLocation[0].options[getSelIndex].dataset.url);
            selectGoBtn.attr('target', '_blank');
            newWindowLinks();
        } else {
            selectGoBtn.removeAttr("href");
            selectGoBtn.attr("results-parameter", selectLocation[0].options[getSelIndex].dataset.url);
            selectGoBtn.attr('target', '_self');
            $(".button--go .new-window-icon, .button--go .new-window-icon .screen-reader-only").hide();
            selectGoBtn.click(function (e) {
                e.preventDefault();
                onClickFetchResult();
                $(".cmp-opportunity--regionSelectors").hide();
            });
        }
    }
}

/**
 *  Initialization
 */
function initLocationSet() {

    let regionSel = document.getElementById(idSelector + "-regions"),
        countrySel = document.getElementById(idSelector + "-region-0-country-0"),
        stateSel = document.getElementById(idSelector + "-region-0-state-0"),
        citySel = document.getElementById(idSelector + "-region-0-city-0");

    if (regionSel) {
        regionSel.innerHTML = "";
    }
    if (idSelector === 'events') {
        parentEl = document.getElementsByClassName(EVENTS_AGGREGATE_CLASS);
    } else {
        parentEl = document.getElementsByClassName(OPPORTUNITY_AGGREGATE_CLASS);
    }
    if (!parentEl.length) return;
    // let contextPath = parentEl[0].getAttribute("data-context-path");
    LOCATION_FILTER_PATH += 'filter-metadata-' + idSelector + '.json';
    if (!regionData) regionData = fetchDropdownJson(
        LOCATION_FILTER_PATH)
    if (!regionData) return;

    /* Populate all the regions */
    let ulEl = document.createElement("ul");
    ulEl.setAttribute("class", "region-list");
    let index = 0;
    for (let key in regionData) {
        if (key === "text" || key === "title") continue;
        let listItem = document.createElement("li");
        listItem.setAttribute("class", "region-item");
        listItem.setAttribute("value", key);
        listItem.setAttribute("id", "region-item-" + index);
        listItem.setAttribute("tabindex", -1);
        let Itemspan = document.createElement("span");
        Itemspan.setAttribute("class", "region-item-text");
        Itemspan.setAttribute("value", key);
        Itemspan.appendChild(document.createTextNode(regionData[key].text))
        listItem.appendChild(Itemspan);
        ulEl.appendChild(listItem);
        index++;

    }
    regionSel.appendChild(ulEl);
    /**/


    regions = regionSel.querySelectorAll(".region-item");
    regionsSpan = regionSel.querySelectorAll(".region-item-text");
    locationSelectionSec = document.querySelector("#" + idSelector + "-region-0");
    if (!regions.length) return;
    regionSelection = regions[0].getAttribute("value");
    locationSelectionSec.setAttribute("data-region-name", regionSelection);
    $(locationSelectionSec).find('select[name=country]').attr('aria-label', 'Region ' + regionSelection);
    $(locationSelectionSec).find('select[name=state]').attr('aria-label', 'All states');
    $(locationSelectionSec).find('select[name=city]').attr('aria-label', 'All cities');
    /* Populate countries with first region */
    if (window.innerWidth > 767)
        $(regions[0]).addClass("active");
    $(regions[0]).attr('tabindex', 0);
    populateCountries(countrySel, stateSel, citySel, regionSelection);


    clearSelectionBtn = document.getElementById(idSelector + "-clear-selection");
    addButton = document.getElementById(idSelector + "-add-location");
    if (window.innerWidth < 767) {
        clearSelectionBtn.style.display = "none";
        addButton.style.display = "none";
        hideAllSelections(EP_UL_CLASS_SELECTOR);
        hideAllSelections(SG_UL_CLASS_SELECTOR);
        hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
    }

    accessibilityLocation();


    /* Populate countries on click on other region */
    for (let count = 0; count < regionsSpan.length; count++) {
        regionsSpan[count].onclick = function () {
            let that = regions[count];
            let regionName = $(this).attr("value"),
                filterParent = findAncestor(this, LOCATION_FILTER_CLASS),
                targetRegion = filterParent.querySelector("[data-region-name='" + regionName + "']");
            if (targetRegion && getActualLocationSelections(targetRegion).length > 0) {
                enableClearSelections(targetRegion);
            } else clearSelectionBtn.classList.add("disabled");
            let regionIndex = $(regions).index($(this).parent());
            if (window.innerWidth < 767)
                if ($(this).parent().hasClass("active")) {
                    $(this).parent().removeClass("active");
                    regionSelection = that.getAttribute("value");
                    //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
                    if (idSelector === "ep") {
                        hideAllSelections(EP_UL_CLASS_SELECTOR)
                    } else if (idSelector === "sg") {
                        hideAllSelections(SG_UL_CLASS_SELECTOR);
                    } else {
                        hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
                    }
                    let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
                    let clearButton = document.getElementById(idSelector + "-clear-selection");
                    let addButton = document.getElementById(idSelector + "-add-location");
                    if (targetRegionDdSec) {
                        targetRegionDdSec.style.display = "none";
                        // locationFilterAlignment(1, idSelector);
                    }
                    if (clearButton && addButton) {
                        addButton.style.display = "none";
                        clearButton.style.display = "none";
                    }
                    return;
                }
            $("#" + idSelector + "-regions .region-item").removeClass("active");
            $(this).parent().addClass("active");
            regionSelection = this.getAttribute("value");
            //idSelector === "ep" ? hideAllSelections(EP_UL_CLASS_SELECTOR) : hideAllSelections(SG_UL_CLASS_SELECTOR);
            if (idSelector === "ep") {
                hideAllSelections(EP_UL_CLASS_SELECTOR)
            } else if (idSelector === "sg") {
                hideAllSelections(SG_UL_CLASS_SELECTOR);
            } else {
                hideAllSelections(EVENTS_UL_CLASS_SELECTOR);
            }
            let targetRegionDdSec = document.getElementById(idSelector + "-region-" + regionIndex);
            let clearButton = document.getElementById(idSelector + "-clear-selection");
            let addButton = document.getElementById(idSelector + "-add-location");
            if (clearButton && addButton) {
                addButton.style.display = "block";
                clearButton.style.display = "block";
            }
            if (targetRegionDdSec) {
                targetRegionDdSec.style.display = "block";
                locationFilterAlignment(1, idSelector);

            } else createNewRegionSelctionSec(regionIndex, regionSelection);

        };
    }


    /* On change on country populate states */
    registerCountryChange(countrySel, stateSel, citySel, regionSelection);

    /* On change on state populate cities */
    registerStateChange(countrySel, stateSel, citySel, regionSelection);

    /* On change on city, set few analytics attributes */
    registerCityChange(citySel);

    /* Reset Dropdowns */
    resetDropdows(stateSel, citySel);

    addButton.onclick = function () {
        addButtonHandler();
        $(this).children().blur();
    };

    clearSelectionBtn.onclick = function () {
        clearSelectionHandler(this);
    }

    ///accessibility

    $(".clearSelection").keydown(function (e) {
        if (e.keyCode == 13) {
            clearSelectionHandler(this);

        }
    });


    locationFilterAlignment(0, idSelector);
    // addLocationSelectForLi(".region-item",document.getElementsByClassName("location-selection-section"));
}

function addLocationSelectForLi(parentDiv, appendDiv) {
    var windowWidth = $(window).width();
    if (windowWidth < 768) {
        $(parentDiv).append(appendDiv);
    }
}

/**
 *  Add Button Handler
 */
function addButtonHandler() {
    let currentRegion = document.querySelector("#" + idSelector + "-regions .region-item.active"),
        regionIndex = $(regions).index(currentRegion),
        regionDdSec = document.getElementById(idSelector + "-region-" + regionIndex),
        selectionItems = regionDdSec.querySelectorAll("li");
    regionSelection = currentRegion.getAttribute("value");
    let clonedItem = selectionItems[0].cloneNode(true), deleteBtn;
    deleteBtn = createDeleteButton();
    clonedItem.appendChild(deleteBtn);
    clonedItem.querySelector("#" + idSelector + "-region-" + regionIndex + "-country-0").setAttribute("id", idSelector + "-region-" + regionIndex + "-country-" + (selectionItems.length)),
        clonedItem.querySelector("#" + idSelector + "-region-" + regionIndex + "-state-0").setAttribute("id", idSelector + "-region-" + regionIndex + "-state-" + (selectionItems.length)),
        clonedItem.querySelector("#" + idSelector + "-region-" + regionIndex + "-city-0").setAttribute("id", idSelector + "-region-" + regionIndex + "-city-" + (selectionItems.length));
    regionDdSec.appendChild(clonedItem);
    $(deleteBtn).on("click", deleteHandler);
    let countrySel = document.getElementById(idSelector + "-region-" + regionIndex + "-country-" + selectionItems.length),
        stateSel = document.getElementById(idSelector + "-region-" + regionIndex + "-state-" + selectionItems.length),
        citySel = document.getElementById(idSelector + "-region-" + regionIndex + "-city-" + selectionItems.length)
    countrySel.focus();
    registerCountryChange(countrySel, stateSel, citySel, regionSelection);
    registerStateChange(countrySel, stateSel, citySel, regionSelection);
    registerCityChange(citySel);
    resetDropdows(stateSel, citySel);
}

/**
 *  Clear Selection Handler
 *  @param {*} selector
 */
function clearSelectionHandler(element) {
    let filterParent = findAncestor(element, LOCATION_FILTER_CLASS);
    clearLocalSelections(filterParent);
    $(element).addClass("disabled");

    updateLocationCount(filterParent);
}

/**
 * Hides all selections
 * @param {*} selector
 */
function hideAllSelections(selector) {
    let targetItems = document.querySelectorAll(selector);
    for (let count = 0; count < targetItems.length; count++) {
        targetItems[count].style.display = "none";
    }
}

/**
 * Initialize the region with default selections
 * @param {*} regionIndex
 * @param {*} regionSelection
 */
function createNewRegionSelctionSec(regionIndex, regionSelection) {
    let firstRegion = document.getElementById(idSelector + "-region-0"),
        clonedItem = firstRegion.cloneNode(true),
        childItems = clonedItem.querySelectorAll("li");
    for (let count = 1; count < childItems.length; count++) {
        clonedItem.removeChild(childItems[count]);
    }

    clonedItem.setAttribute("id", idSelector + "-region-" + regionIndex);
    clonedItem.setAttribute("data-region-name", regionSelection);
    $(clonedItem).find('select[name=country]').attr('aria-label', 'Region ' + regionSelection);
    $(clonedItem).find('select[name=state]').attr('aria-label', 'All States');
    $(clonedItem).find('select[name=city]').attr('aria-label', 'All Cities');
    let countrySel = clonedItem.querySelector("[name='country']"),
        stateSel = clonedItem.querySelector("[name='state']"),
        citySel = clonedItem.querySelector("[name='city']");
    countrySel.setAttribute("id", idSelector + "-region-" + regionIndex + "-country-0");
    stateSel.setAttribute("id", idSelector + "-region-" + regionIndex + "-state-0");
    citySel.setAttribute("id", idSelector + "-region-" + regionIndex + "-city-0");
    let previousItem;
    for (let count = 1; count <= regionIndex; count++) {
        if (document.getElementById(idSelector + "-region-" + (regionIndex - count)) !== null) {
            previousItem = document.getElementById(idSelector + "-region-" + (regionIndex - count));
            break;
        }
    }
    //previousItem.after(clonedItem);
    previousItem.parentNode.insertBefore(clonedItem, previousItem.nextSibling);
    clonedItem.style.display = "block";
    populateCountries(countrySel, stateSel, citySel, regionSelection);
    registerCountryChange(countrySel, stateSel, citySel, regionSelection);
    registerStateChange(countrySel, stateSel, citySel, regionSelection);
    registerCityChange(citySel);
    resetDropdows(stateSel, citySel);
    locationFilterAlignment(0, idSelector);
}

/**
 * Delete Handler
 * @param {*} event
 */
function deleteHandler(event) {
    event.preventDefault();
    let ancestor = event.target.parentElement.parentElement,
        regionId = ancestor.getAttribute("id");
    event.target.parentElement.remove();
    let dropdownItems = ancestor.querySelectorAll("li");
    if (dropdownItems.length > 1) {
        for (let count = 0; count < dropdownItems.length; count++) {
            dropdownItems[count].querySelector("[name='country'").setAttribute("id", regionId + "-country-" + count);
            dropdownItems[count].querySelector("[name='state'").setAttribute("id", regionId + "-state-" + count);
            dropdownItems[count].querySelector("[name='city'").setAttribute("id", regionId + "-city-" + count);
        }
    }
    let filterParent = findAncestor(ancestor, LOCATION_FILTER_CLASS);
    updateLocationCount(filterParent);
}

/**
 * Registers onchange event on country change
 * @param {*} countrySel
 * @param {*} stateSel
 * @param {*} citySel
 * @param {*} regionSelection
 */
function registerCountryChange(countrySel, stateSel, citySel, regionSelection) {
    countrySel.onchange = function () {
        let filterParent = findAncestor(this, LOCATION_FILTER_CLASS),
            countrySelection = this.value;
        if (getActualLocationSelections(filterParent).length > 0) {
            enableClearSelections(countrySel);
            setAnalyticsOnDoneBtn(filterParent);
        }
        resetDropdows(stateSel, citySel);
        if (idSelector !== "events")
            populateStates(stateSel, citySel, regionSelection, countrySelection);

        updateLocationCount(filterParent);
    };
}

/**
 * Registers onchange event on state change
 * @param {*} countrySel
 * @param {*} stateSel
 * @param {*} citySel
 * @param {*} regionSelection
 */
function registerStateChange(countrySel, stateSel, citySel, regionSelection) {
    stateSel.onchange = function () {
        citySel.style.display = 'none';
        let stateSelection = this.value,
            countrySelection = countrySel.value,
            filterParent = findAncestor(this, LOCATION_FILTER_CLASS);
        setAnalyticsOnDoneBtn(filterParent);
        populateCities(citySel, stateSelection, countrySelection, regionSelection);
    }
}

/**
 * Registers onchange event on city change
 * @param {*} citySel
 */
function registerCityChange(citySel) {
    citySel.onchange = function () {
        let filterParent = findAncestor(this, LOCATION_FILTER_CLASS);
        setAnalyticsOnDoneBtn(filterParent);
    }
}

/**
 * Populate coutries on the country dropdown
 * @param {*} countrySel
 * @param {*} stateSel
 * @param {*} citySel
 * @param {*} regionSelection
 */
function populateCountries(countrySel, stateSel, citySel, regionSelection) {
    countrySel.length = 2;
    stateSel.length = 1;
    citySel.length = 1;

    regionData[regionSelection].values.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    for (let key in regionData[regionSelection].values) {
        countrySel.options[countrySel.options.length] = new Option(regionData[regionSelection].values[key].text.replace("Korea, Republic of", "Republic of Korea"), regionData[regionSelection].values[key].name);
    }
    countrySel.value = countrySel.options[0].value;
}

/**
 * Populate states on the state dropdown
 * @param {*} stateSel
 * @param {*} citySel
 * @param {*} regionSelection
 * @param {*} countrySelection
 */
function populateStates(stateSel, citySel, regionSelection, countrySelection) {
    stateSel.length = 1;
    citySel.length = 1;
    let searchResults = regionData[regionSelection].values.filter(function (state) {
        return state.name.indexOf(countrySelection) > -1;
    });
    if (searchResults.length < 1) return;
    searchResults[0].values.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    for (let key in searchResults[0].values) {
        stateSel.options[stateSel.options.length] = new Option(searchResults[0].values[key].text, searchResults[0].values[key].name);
    }
    if (searchResults[0].values) {
        if (searchResults[0].values.length < 2) {
            stateSel.style.display = 'none';
            populateCities(citySel, searchResults[0].values[0].name, countrySelection, regionSelection, regionData);
        } else {
            stateSel.style.display = 'block';
        }
    } else stateSel.style.display = 'none';
}

/**
 * Populate cities on the city dropdown
 * @param {*} citySel
 * @param {*} stateSelection
 * @param {*} countrySelection
 * @param {*} regionSelection
 */
function populateCities(citySel, stateSelection, countrySelection, regionSelection) {
    citySel.length = 1;
    let countrySearchResults = regionData[regionSelection].values.filter(function (state) {
        return state.name.indexOf(countrySelection) > -1;
    });
    if (countrySearchResults.length < 1) return;
    let stateSearchResults = countrySearchResults[0].values.filter(function (city) {
        return city.name.indexOf(stateSelection) > -1;
    });
    stateSearchResults[0].values.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    for (let key in stateSearchResults[0].values) {
        citySel.options[citySel.options.length] = new Option(stateSearchResults[0].values[key].text, stateSearchResults[0].values[key].name);
    }
    if (stateSearchResults[0].values) {
        stateSearchResults[0].values.length < 2 ? citySel.style.display = 'none' : citySel.style.display = 'block';
    } else citySel.style.display = 'none';
}

/**
 * Dynamically create Delete button
 */
function createDeleteButton() {
    let button = document.createElement("button");
    button.setAttribute("class", "remove-selection");
    button.innerText = "Remove Selection";
    return button;
}

/**
 * Finds out the ancestor of the current element based on the class name
 * @param {*Current element} el
 * @param {*Ancestor className} cls
 */
function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
}

/**
 * Fetch dropdown json
 * @param {*} jsonPath
 */
function fetchDropdownJson(jsonPath) {
    var jsonData;
    $.ajax({
        url: jsonPath,
        type: "GET",
        async: false,
        success: function (result) {
            jsonData = result;
        }
    });
    return jsonData;
}

/**
 * Reset State and City dropdowns
 * @param {*} stateSel
 * @param {*} citySel
 */
function resetDropdows(stateSel, citySel) {
    stateSel.style.display = 'none';
    citySel.style.display = 'none';
}

/**
 * Enable the Clear Selection Button
 * @param {*} element
 */
function enableClearSelections(element) {
    let ancestor = findAncestor(element, LOCATION_FILTER_CLASS),
        clearButton = ancestor.querySelector("." + PARENT_CLEAR_SELECTION_CLASS);
    clearButton.className = PARENT_CLEAR_SELECTION_CLASS;
    $(clearButton).attr('tabindex', '0');
}

/**
 * Clear All the selections of all the selected regions

 * @param {*} element
 */
function clearAllSelections(element) {
    let selectedRegions = element.querySelectorAll("ul.location-selection-section"),
        regionContainer = document.getElementById(idSelector + "-regions"),
        regionListParent = regionContainer.querySelector("ul");
    if (selectedRegions.length > 1) {
        for (let count = 1; count < selectedRegions.length; count++) {
            //Remove other region selections
            selectedRegions[count - 1].remove();
        }
    }

    removeSecondarySelections(selectedRegions[0]);
    selectedRegions[0].style.display = "block";
    if (regionListParent) regionListParent.remove();
}

function clearAllMobileSelections(element) {
    let regions = element.querySelectorAll(".region-item");
    for (let count = 0; count < regions.length; count++) {

        removeSecondarySelections(regions[count]);
        resetPrimarySelections(regions[count]);
    }
}

/**
 * Clear all the selections under particular region
 * @param {*} element
 */
function clearLocalSelections(element) {
    //let selectedRegionName = element.querySelector(".region-item.active").textContent.trim(),
    let selectedRegionName = $(".region-item.active").attr("value"),
        targetRegion = element.querySelector("[data-region-name='" + selectedRegionName + "']");
    if (!targetRegion) return;
    removeSecondarySelections(targetRegion);
    resetPrimarySelections(targetRegion);
}

/**
 * Remove all the secondary selections under particular region
 * @param {*} region
 */
function removeSecondarySelections(region) {
    let allSelections = region.querySelectorAll("li");
    if (allSelections.length > 1) {
        for (let count = 1; count < allSelections.length; count++) {

            allSelections[count].remove();
        }
    }
}

/**
 * Reset primary selection
 * @param {*} region
 */
function resetPrimarySelections(region) {
    let selection = region.querySelector("li");
    if (!selection) return;
    let countrySel = selection.querySelector("[name='country']"),
        stateSel = selection.querySelector("[name='state']"),
        citySel = selection.querySelector("[name='city']");
    countrySel.selectedIndex = 0;
    stateSel.selectedIndex = 0;
    citySel.selectedIndex = 0;
    resetDropdows(stateSel, citySel);
}

/**
 * Update the location count
 * @param {*} element
 */
function updateLocationCount(element) {
    if (idSelector === 'events') {
        RESULTSET_CLASS = 'cmp-events--filter--resultset';
    }
    let parent = findAncestor(element, RESULTSET_CLASS),
        locationLabel = parent.querySelector("." + LOCATION_LABEL_CLASS),
        actualSelectionsLength = getActualLocationSelections(element).length;
    if (actualSelectionsLength > 0) {
        locationLabel.innerText = "Location (" + actualSelectionsLength + " selected)";
        parent.querySelector("." + CLEAR_ALL_BUTTON_CLASS).classList.remove("disabled");
        parent.querySelector("." + CLEAR_ALL_BUTTON_CLASS).setAttribute("tabindex", "0");
        parent.querySelector(".clearSelection").setAttribute("tabindex", "0");
    } else {
        $(".clearSelection").attr("tabindex", -1).blur();
        locationLabel.innerText = "Location";
    }
}

/**
 * Get the actual selections list
 * @param {*} element
 */
function getActualLocationSelections(element) {
    let totalSelections = element.querySelectorAll("[name='country']"),
        selections = [];
    for (let count = 0; count < totalSelections.length; count++) {
        if (totalSelections[count].value !== "select-any-country") selections.push(totalSelections[count]);
    }
    return selections;
}

/**
 * Capitalizes the String
 * @param {*} targetString
 */
function capitalizeString(targetString) {
    if (typeof targetString !== 'string') return '';
    let splittedItems = targetString.split(" "), finalString = "";
    for (let count = 0; count < splittedItems.length; count++) {
        splittedItems[count] = splittedItems[count].toLowerCase();
        finalString = finalString + splittedItems[count].charAt(0).toUpperCase() + splittedItems[count].slice(1) + " ";
    }
    return finalString.trim(finalString.charAt(finalString.length));
}

function setAnalyticsOnDoneBtn(filterParent) {

    if (idSelector === 'events') {
        RESULTSET_CLASS = 'cmp-events--filter--resultset';
    }
    let filterDoneBtn = findAncestor(filterParent, RESULTSET_CLASS).querySelector(FILTER_DONE_BTN_SELECTOR);
    if (filterDoneBtn) {
        let filterLabel = findAncestor(filterParent, ACCORDION_WRAPPER_CLASS).querySelector("." + FILTER_LABEL_CLASS).textContent.trim(),
            flowType = experienceHire ? "Experienced Professionals" : "S&G";
        filterLabel = filterLabel.indexOf("(") !== -1 ? filterLabel.slice(0, filterLabel.indexOf("(")).trim() : filterLabel;
        filterDoneBtn.setAttribute("data-analytics-link", "Careers Search Filter | " + flowType + " | " + filterLabel + " | Done");
        filterDoneBtn.setAttribute("data-analytics-button", "Careers Search Filter | " + flowType + " | " + filterLabel + " | Done");
    }
}
(function ($, $document) {
    $document.ready( function() {
     $('.cmp-conversionbreaker__phonenumber a').attr("tabindex", "-1");
     if (screen.width > 767) {
         $('.cmp-conversionbreaker__phonenumber a').on('click', function (event) {
             event.preventDefault();
         });
     }
 });
})(jQuery, jQuery(document));
$(document).ready(function () {
    if (document.querySelector('.cmp-horizontalCta-wrapper')) {
        stringToAscii = function (s) {
            var ascii = "";
            if (s.length > 0)
                for (i = 0; i < s.length; i++) {
                    var c = "" + s.charCodeAt(i);
                    while (c.length < 3)
                        c = "0" + c;
                    ascii += c;
                }
            return (ascii);
        }

        notificationService = function (url) {
            notificationSrvcURL = url;
            try {

                var notificationcount = $.getJSON(notificationSrvcURL, function (data) { })
                    .done(function (data) { });
                $.when(notificationcount).fail(function (jqXHR, textStatus, errorThrown) { });
            } catch (err) {
            }
        };

        validate_horizontal_email = function (currentBtn) {
            var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
            var $currentForm = currentBtn.closest('form');
            var $errorMsgEl = $currentForm.find('.hcc-email-subscribe-error-message');
            var $successMsgEl = $currentForm.find('.hcc-email-subscribe-success-message');
            var entry_email = $currentForm
                .find('input[name=hcc-email-subscribe-input-address]')
                .val();
            var mid = $currentForm.data('subscriptionMid');
            var lid = $currentForm.data('subscriptionCidkey');
            var validEmail = emailReg.test(entry_email);
            if (!$currentForm) {
                throw new Error('The subscription related markup should be placed into a <form> element')
            }
            if (!validEmail) {
                $errorMsgEl
                    .addClass("error-highlight")
                    .css({ 'display': 'block' })
            } else {
                $errorMsgEl.css({ 'display': 'none' })
                $currentForm.html($successMsgEl.html());

                var strEmail = "https://cl.s7.exct.net/subscribe.aspx?" +
                    "MID=" + mid +
                    "&lid=" + lid +
                    "&Email%20Type=" + "HTML" +
                    "&Email%20Address=" + entry_email +
                    "&referrer=" + window.location.href;
                notificationService(strEmail);
            }
        };

        $(".hcc-btn-subscribe-CTA").click(function () {
            validate_horizontal_email($(this));
        });

        $(".hcc-btn-subscribe-CTA, .hcc-email-subscribe-input").keypress(function (e) {
            if (e.which === 13) {
                e.preventDefault()
                var $button = $(e.target)
                    .closest('form')
                    .find('.hcc-btn-subscribe-CTA')
                validate_horizontal_email($button);
            }
        });

        $('.hcc-email-subscribe-input').on('change', function () {
            var $currentInput = $(this);
            var email_subscribe_length = $currentInput.val().length;
            var $currentForm = $currentInput.closest('form')
            var $currentLabel = $currentForm.find('label')

            if (email_subscribe_length > 0) {
                $currentLabel.addClass('show');
            } else {
                $currentLabel.removeClass('show');
            }
        });
    }
});

$(document).ready(function() {
    $(".subscribe-content-wrapper .input-wrapper input").on("checkval", function() {
        var labelText = $(this).next("label");
        "" !== this.value ? labelText.addClass("show") : labelText.removeClass("show")
    }).on("keyup", function(e) {
        $.trim($(this).val());
        $(this).val().length > 0 && $("*[class^='email-subscribe']").hasClass("error-highlight") && 13 !== e.which && ($("*[class^='email-subscribe']").removeClass("error-highlight"), $(".email-subscribe-error-message").attr("aria-hidden", "true"), $("*[class^='email-subscribe-CTA']").attr("aria-invalid", "false"), $("*[class^='email-subscribe-CTA']").removeAttr("aria-describedby")), $(this).trigger("checkval")
    })


    var mid = $("#subscription-mid").text(),
        firstsublistid = $("#firstsublistid").text(),
        secondsublistid = $("#secondsublistid").text(),
        cidkey = $("#survey-externalKey").text(),
        defaultMsdotcomOptions = $("#default-msdotcom-options").text(),
        subscribeOptionNameCount = $("#subscribeOptionNameCount").text(),
        subOptNameCountValue = parseInt(subscribeOptionNameCount);
    $("#NewsletterSubmitNew").click(function() {
        validate_ideas_email(mid, firstsublistid, secondsublistid)        
    });
    $("#NewsletterSurveySubmit").click(function() {
        submit_survey(mid, cidkey, defaultMsdotcomOptions, subOptNameCountValue)
    });
    $(".btn-subscribe-CTA, .email-subscribe-CTA").keypress(function(e) {
        "13" == e.which && ($(".subscribe-content-wrapper").is(":visible") ? validate_ideas_email(mid, firstsublistid, secondsublistid) : $(".thankyou-wrapper").is(":visible") && submit_survey(mid, cidkey, defaultMsdotcomOptions, subOptNameCountValue))
    });

});

stringToAscii = function(s) {
    var ascii = "";
    if (s.length > 0)
        for (i = 0; i < s.length; i++) {
            for (var c = "" + s.charCodeAt(i); c.length < 3;) c = "0" + c;
            ascii += c;
        }
    return ascii;
};
getQueryParams = function(qs) {
    qs = qs.split("+").join(" ");
    for (var tokens, params = {}, re = /[?&]?([^=]+)=([^&]*)/g; tokens = re.exec(qs);) params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    return params;
};

notificationService = function(url) {
    notificationSrvcURL = url;
    try {
        var notificationcount = $.getJSON(notificationSrvcURL, function(data) {}).done(function(data) {});
        $.when(notificationcount).fail(function(jqXHR, textStatus, errorThrown) {})
    } catch (err) {}
};
validate_ideas_email = function(mid, firstsublistid, secondsublistid) {
    var users = ["morganstanley.com", "morganstanleycredit.com", "morganstanleygraystone.com", "morganstanleyhomeloans.com", "morganstanleymufg.com", "morganstanleypwm.com", "morganstanleysmithbarney.com", "ms.com", "mscibarra.com", "msfundservices.com", "msgraystone.com", "mssb.com", "mumss.com", "rmbmorganstanley.com", "saxonmsi.com", "saxonmtg.com", "smithbarney.com", "vankampen.com"],
        lists = [];
    lists = firstsublistid ? [firstsublistid] : firstsublistid && firstsublistid ? [firstsublistid, firstsublistid] : ["63766", "63954"];
    var emailReg = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i),
        entry_email = $("input[name=email-subscribe-CTA-address]").val(),
        optInCheckbox = $("#optIn").text();
    if (emailReg.test(entry_email)) {
         if($("#opt-in").prop('checked') == false && optInCheckbox == "true"){
               $("*[class^='opt-in-error-message']").addClass("opt-in-error-highlight"), $("*[class^='opt-in-for-newsletter']").attr("aria-invalid", "true")
         } else {
            if($("#questionAnswerData").text() == "false"){
                $(".congrats-wrapper.thankyou-wrapper.secondary").hide(),$(".congrats-wrapper.primary").addClass("visible");
                } else {
                    $(".congrats-wrapper.primary").addClass("visible"),$(".congrats-wrapper.thankyou-wrapper.secondary").hide(),$(".btn-capsule").hide();
                }
           $(".subscribe-content-wrapper").addClass("hidden"), $("*[class^='email-subscribe-CTA']").attr("aria-invalid", "false");
        var lid = lists[0];
            mid = $("#subscription-mid").text();
        for (i = 0; i < users.length; i++) !firstsublistid && entry_email.toLowerCase().indexOf(users[i]) > 0 && (lid = lists[1]);
        var qr = getQueryParams(document.location.search),
            et_cid = /^em_[0-9]{1,9}$/.test(qr.et_cid) ? qr.et_cid : "",
            firstName = $("input[name=capture-first-name]").val(),
            lastName = $("input[name=capture-last-name]").val(),
            opt_In = $("input[opt-in]").val(),
            strEmail = ($(".subscribe-eFormName").attr("data-eformname"), "https://cl.s7.exct.net/subscribe.aspx?MID=" + mid + "&lid=" + lid + `${firstName !== undefined ? "&firstName=" + firstName : ""}` + `${lastName !== undefined ? "&lastName=" + lastName : ""}` + "&Email%20Type=HTML&Email%20Address=" + entry_email + "&et_cid=" + et_cid + "&referrer=" + window.location.href),
            hashedEmail = stringToAscii(entry_email);
            digitalData.contact = hashedEmail,notificationService(strEmail);
         }
    } else $("*[class^='email-subscribe']").addClass("error-highlight"), $("*[class^='email-subscribe-CTA']").attr("aria-invalid", "true");
};
submit_survey = function(cid, cidkey, defaultMsdotcomOptions, subOptNameCountValue) {
    var EmailAddress = $("input[name=email-subscribe-CTA-address]").val();
    if ("default-msdotcom-options" == defaultMsdotcomOptions) var IdeasInterests = $('input[name="IdeasInterests"]:checked').map(function() {
            return this.value
        }).get().join(", "),
        DescribeYourself = $('input[name="DescribeYourself"]:checked').map(function() {
            return this.value
        }).get().join(", ");
    if ($(".congrats-wrapper").hide(), $(".thankyou-wrapper").show(), "default-msdotcom-options" == defaultMsdotcomOptions) $.ajax({
        url: "https://cl.s7.exct.net/DEManager.aspx",
        type: "post",
        data: "_clientID=" + cid + "&_deExternalKey=" + cidkey + "&_action=add&_returnXML=0&_successURL=https://www.morganstanley.com/newsletter/newsletter-signup-success.html&_errorURL=https://www.morganstanley.com/newsletter/newsletter-signup-error.html&EmailAddress=" + encodeURIComponent(EmailAddress) + "&IdeasInterests=" + encodeURIComponent(IdeasInterests) + "&DescribeYourself=" + encodeURIComponent(DescribeYourself),
        success: function(data) {
            console.log("survey submitted.");
        }
    });
    else {
        for (var fireData = "_clientID=" + cid + "&_deExternalKey=" + cidkey + "&_action=add&_returnXML=0&_successURL=https://www.morganstanley.com/newsletter/newsletter-signup-success.html&_errorURL=https://www.morganstanley.com/newsletter/newsletter-signup-error.html&EmailAddress=" + encodeURIComponent(EmailAddress), i = 1; i <= subOptNameCountValue; i++) {
            var currentSubscribeOptionName = "subscribeOptionName" + i,
                subscribeOptionName = ($("#subscribeOptionName1").text(), $("#" + currentSubscribeOptionName).text()),
                checkedoptionname = $('input[name="' + subscribeOptionName + '"]:checked').map(function() {
                    return this.value
                }).get().join(", ");
            fireData = fireData + "&" + subscribeOptionName + "=" + encodeURIComponent(checkedoptionname)
        }
        $.ajax({
            url: "https://cl.s7.exct.net/DEManager.aspx",
            type: "post",
            data: fireData,
            success: function(data) {
                console.log("survey submitted.");
            }
        })
    }
};  


$(document).ready(function() {

	var clickBoolean = false;
    var $recirculationSection = $(".recirculationgrid__section.grid-control");
	$recirculationSection.each(function(index) {
		if($(this).hasClass("four-up__style")) {
			$(this).find(".cmp-container > div > div").hide();
			$(this).find(".cmp-container > div > div:lt(12)").show();
			clickViewMore();
            return true;
		} else if($(this).hasClass("three-up__style")) {
			$(this).find(".cmp-container > div > div").hide();
			$(this).find(".cmp-container > div > div:lt(3)").show();
			clickViewMore();
            return true;
		} else if($(this).hasClass("three-up-center__style")) {
			$(this).find(".cmp-container > div > div").hide();
			$(this).find(".cmp-container > div > div:lt(3)").show();
			clickViewMore();
            return true;
		} else if($(this).hasClass("two-up__style")) {
            $(this).find(".cmp-container > div > div").hide();
			$(this).find(".cmp-container > div > div:lt(2)").show();
			clickViewMore();
            return true;
		}
	});

	function clickViewMore() {
		var $clickViewMoreBtn = $(".recirculationgrid__section.grid-control .loadMoreCards");
		$clickViewMoreBtn.each(function(index) {
			$(this).on("click", function(e) {
			e.preventDefault();
			$(this).parent().find(".cmp-container > div > div").show();
			clickBoolean = true;
			if(clickBoolean) 
                $(this).off("click").blur();
			});
		});
	} 

}); 
;(function ($, $document) {

    var PODCAST_SUBSCRIBE_BUTTON_CLASS = "artPodaud_subscribe",
        PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS = "artPodaud_subscribeContain",
        isModalOpen = false, $subscribeButtons;

    $document.ready(function () {
        "use strict";
        $(".artPodaud_transcript").css({"display" : "none"});
        $("body").click(function(event){
            if(!event.target.closest(".showaud_transcript") && !event.target.closest(".artPodaud_transcript")) {
                if($(".showaud_transcript").attr("aria-expanded") === "true") {
                    $(".artPodaud_transcript").css({"display" : "none"});
                    $(".showaud_transcript").attr("aria-expanded","false");
                    $(".showaud_transcript").attr("aria-pressed","false");
                    $(".viewaudTS").show();
                    $(".hideaudTS").hide();
                }
            }
        })
		$(".showaud_transcript").click(function(e) {
            if($(".showaud_transcript").attr("aria-expanded") === "true") {
                $(".showaud_transcript").attr("aria-expanded","false");
                $(".show_transcript").attr("aria-pressed","false");
            }else {
                $(".showaud_transcript").attr("aria-expanded","true");
                $(".show_transcript").attr("aria-pressed","true");
            }
            let that = $(this).parent().parent().parent();
            console.log("that====",that)
            $(that).find(".artPodaud_transcript").toggle();
            $(this).find(".viewaudTS").toggle();
            $(this).find(".hideaudTS").toggle();
            $('.full-image-hero').css({"overflow" : "visible"});
		});
		$(".artPodaud_transcript_exit").on("click", function() {
            $(".artPodaud_transcript").css({"display" : "none"});
             $(".viewaudTS").toggle();
             $(".hideaudTS").toggle();

		});
		$subscribeButtons = $("." + PODCAST_SUBSCRIBE_BUTTON_CLASS);
        $subscribeButtons.each(function (index) {
            addListeners(this);
        });
		/**Modal window keyboard Accessibility**/
		$(".artPodaud_transcript_title").on('keydown', function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == 9 && (!e.shiftKey)) {
			e.preventDefault();
				$('.artPodaud_contain .vjs-play-control').focus();
			}
        });
        
    });

    /* Enables Event Listener for all the Subscribe buttons */
    function addListeners(subscribeButton) {
        subscribeButton.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS).style.opacity = "0";
        enableAnchorLinks($(subscribeButton.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), false);
        subscribeButton.addEventListener("focusin", subscribeButtonFocusInEventListener);
        subscribeButton.addEventListener("focusout", subscribeButtonFocusOutEventListener);
        subscribeButton.addEventListener("mouseover", subscribeButtonHoverInEventListener);
        subscribeButton.addEventListener("mouseleave", subscribeButtonHoverLeaveEventListener);
    }

    /* Handles Event Listener on focus or mouse leave on Subscribe Button */
    function subscribeButtonFocusInEventListener(event) {
        toggleModal(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS), true);
        isModalOpen ? enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), true) :
            enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), false);
    }

    /* Handles Event Listener on focus or mouse leave on Subscribe Button */
    function subscribeButtonFocusOutEventListener(event) {
        toggleModal(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS), false);
        isModalOpen ? enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), true) :
            enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), false);
    }

    /* Handles Event Listener on Mouse hover on Subscribe Button */
    function subscribeButtonHoverInEventListener(event) {
        if (this === event.target && this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS).style.opacity === "0") {
			$(this).css("text-decoration", "underline");
            enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), true);
            toggleModal(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS), true);
        }
    }

    /* Handles Event Listener on Mouse Leave on Subscribe Button */
    function subscribeButtonHoverLeaveEventListener(event) {
        if (this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS).style.opacity === "1") {
			$(this).css("text-decoration", "none");
            toggleModal(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS), false);
            enableAnchorLinks($(this.querySelector("." + PODCAST_SUBSCRIBE_BUTTON_CONTAINER_CLASS)), false);
        }
    }

    /**
     * Toggles Modal's display
     * @param {*} targetElement 
     * @param {*} openModal 
     */
    function toggleModal(targetElement, openModal) {
        if (!targetElement) return;
        if (isModalOpen) {
            if(!openModal) {
                $(targetElement).css("opacity", "0");
            	isModalOpen = false;
            }
        } else {
            if(openModal) {
                $(targetElement).css("opacity", "1");
            	isModalOpen = true;
            }
        }
    }

    /**
     * Enable or disable Subscribe Links
     * @param {*$targetElement - Target Element} 
     * @param {*enableLink value true or false} 
     */
    function enableAnchorLinks($targetElement, enableLink) {
        if (!$targetElement) return;
        enableLink ? $targetElement.css("pointer-events", "all") : $targetElement.css("pointer-events", "none");
        enableLink ? $targetElement.css("cursor", "") : $targetElement.css("cursor", "default");
    }

})(jQuery, jQuery(document));
$(document).ready(function () {
	var imagesrc = $(".cmp-inlinevideo__image").attr("src");
	var imgPath = "background-image: url(" + imagesrc + ")";
	var inlineVideoHeadline = $('.inline-video-style .cmp-title__text').text();
	var na="NA";
	var analyticsVideoTitle = $(".inlinevideo-title p").text();
	var analyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | Social | ";
	var emailanalyticsLinkValue = (inlineVideoHeadline ||na)+" | In-Line Video | "+analyticsVideoTitle+" | Share Module | ";

	if (imgPath) {
		setTimeout(function () {
			$("#inlinevideoID .vjs-poster").attr("style", imgPath);
		}, 1500);
	}
	
	$(".inlinevideo-share-social .share-twitter").attr("data-analytics-link",analyticsLinkValue+"Twitter");
	$(".inlinevideo-share-social .share-linkedin").attr("data-analytics-link",analyticsLinkValue+"LinkedIn");
	$(".inlinevideo-share-social .share-facebook").attr("data-analytics-link",analyticsLinkValue+"Facebook");
	$(".inlinevideo-share-social .share-email").attr("data-analytics-link",emailanalyticsLinkValue+"Email");


	/* Inline social share */
    $(".inlineaudio-share").on("click", function(e){

		//$(this).find(".inlineaudio-share-social ").toggle();
       e.stopPropagation();
		$(this).find(".inlineaudio-share-social ").toggle();
		if($(this).find(".inlineaudio-share-social").is(':visible')){
			$(this).find(".inlineaudio-share").attr("aria-expanded", "true");
		}
		else{
			$(this).find(".inlineaudio-share").attr("aria-expanded", "false");
		}
      //  $(this).find(".inlinevideo-share-social").toggleClass('show')
    })

/*$(".inlinevideo-share").each(function(index) {
	console.log("before this==",this)
    $(this).on("click", function(){

        //e.stopPropagation();
        console.log("yhid====",this)
		$(this).find(".inlinevideo-share-social ").toggle();
		if($(this).find(".inlinevideo-share-social ").is(':visible')){
			$(this).find(".inlinevideo-share").attr("aria-expanded", "true");
		}
		else{
			$(this).find(".inlinevideo-share").attr("aria-expanded", "false");
		}
    });
}); */

/*$(".inlinevideo-share").each(function(index) {

    $(this).on("click", function(){
        debugger;
		 var $socialShare= $(".inlinevideo-share-social ");
			$.each($socialShare, function(i, key) {
			$(this).find(".inlinevideo-share-social ").toggle();
		if($(this).find(".inlinevideo-share-social").is(':visible')){
			$(this).find(".inlinevideo-share").attr("aria-expanded", "true");
		}
		}); 
    });
}); */




$(document).click(function (e) {

		if ($(e.target).parents(".inlineaudio-share-social ").length === 0) {
		 	$(".inlineaudio-share-social ").hide();
			$(".inlineaudio-share").attr("aria-expanded", "false");
		}
	});


	$(".inlineaudio-share .inlineaudio-share-social .share-email").focusout(function () {
	$(".inlineaudio-share-social ").hide();
		$(".inlineaudio-share").attr("aria-expanded", "false");
	});

	$(document).on('keydown', function (event) {
		if (event.keyCode == 27) {
			$(".inlineaudio-share-social ").hide();
			$(".inlineaudio-share").attr("aria-expanded", "false");
		}
	})




});
