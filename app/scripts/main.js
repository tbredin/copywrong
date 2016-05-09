var copywrong = (function($){

    // globally accessible variables
    var _module = {
        $window: $(window),
        $document: $(document),
        $scrollTarget: $('html, body'),
        scrollY: 0,
        mediaDesktopUp: 'screen and (min-width: 68.75em)',
        isDesktop: false,
        userAgent: navigator.userAgent,
        isTouch: ('ontouchstart' in window)
    }

    console.log(_module.userAgent);

    // Put all custom scroll updates here
    // Important: please exercise restraint — this function has a very heavy impact on performance while scrolling!
    _module.scrollUpdates = function() {
        // console.log('== Event: scroll');
        _module.scrollY = _module.$window.scrollTop();
    }

    // put all custom resize updates here
    _module.resizeUpdates = function() {
        // console.log('== Event: resize');
        crikeyFollower.refreshRailway();
        crikeyFooter.updateHeight();
    }

    // put all custom resize updates here
    _module.enquireDesktopVars = function() {
        enquire.register(_module.mediaDesktopUp, {

            // triggered when a media query matches.
            match : function() {
                // console.log("matched");
                _module.isDesktop = true;
            },

            // triggered when the media query transitions
            // *from a matched state to an unmatched state*.
            unmatch : function() {
                // console.log("unmatched");
                _module.isDesktop = false;
            },
        });
    }

    // initialise all independant modules, bind events
    _module.init = function() {
        // enquire media query variables
        // _module.enquireDesktopVars();

        // independant modules: Go!
        // moduleName.init();

        // bind events
        // _module.$window.bind('scroll', _module.scrollUpdates);
        // _module.$window.bind('resize', _module.resizeUpdates);

        $('a[href*=#]').click(function(e) {
            e.preventDefault();

            var $this = $(e.target);
            var href = $this.attr('href');
            var $target = $(href);
            var $nextAnchor = $this.parent().nextAll().find('a[href*=#]').first();

            // console.log($nextAnchor);

            // if (href == '#can-you-remind-me') {
                $('.footer').removeClass('hide');
            // }

            if ($nextAnchor.length) {
                $nextAnchor.parent().removeClass('hide');
            }

            $target.removeClass('hide');
            $this.parent().remove();
        });
    }

    return _module;

})(jQuery);

// Go!
$(document).ready(function() {
    copywrong.init();
});
