/*
* $ lightbox_me
* By: Buck Wilson ("animate" support by Brian Kennish)
* Version: 2.4
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
*/


(function($) {

    $.fn.lightbox_me = function(options) {

        return this.each(function() {

            var
                opts = $.extend({}, $.fn.lightbox_me.defaults, options),
                $overlay = $(),
                $self = $(this),
                properties = {
                    left: $self.css('left'),
                    top: $self.css('top'),
                    marginLeft: $self.css('marginLeft'),
                    marginTop: $self.css('marginTop'),
                    borderTopLeftRadius: $self.css('borderTopLeftRadius'),
                    MozBorderTopLeftRadius: $self.css('MozBorderTopLeftRadius'),
                    WebkitBorderTopLeftRadius:
                            $self.css('WebkitBorderTopLeftRadius'),
                    borderTopRightRadius: $self.css('borderTopRightRadius'),
                    MozBorderTopRightRadius:
                            $self.css('MozBorderTopRightRadius'),
                    WebkitBorderTopRightRadius:
                            $self.css('WebkitBorderTopRightRadius'),
                    borderBottomLeftRadius: $self.css('borderBottomLeftRadius'),
                    MozBorderBottomLeftRadius:
                            $self.css('MozBorderBottomLeftRadius'),
                    WebkitBorderBottomLeftRadius:
                            $self.css('WebkitBorderBottomLeftRadius'),
                    borderBottomRightRadius:
                            $self.css('borderBottomRightRadius'),
                    MozBorderBottomRightRadius:
                            $self.css('MozBorderBottomRightRadius'),
                    WebkitBorderBottomRightRadius:
                            $self.css('WebkitBorderBottomRightRadius'),
                    width: $self.width(),
                    height: $self.height()
                }, // Look away -- I'm hideous.
                ie6 = $.browser.msie && $.browser.version < 7,
                $iframe = $(
                    '<iframe style="position: absolute; left: 0; top: 0; z-index: '
                            + (opts.zIndex + 1) +
                                    '; margin: 0; border: 0; padding: 0; width: 100%; height: 100%; filter: mask()"/>'
                );

            if (opts.showOverlay) {
                //check if there's an existing overlay, if so, make subequent ones clear
               var $currentOverlays = $(".js_lb_overlay:visible");
                if ($currentOverlays.length > 0){
                    $overlay = $('<div class="lb_overlay_clear js_lb_overlay"/>');
                } else {
                    $overlay = $('<div class="' + opts.classPrefix + '_overlay js_lb_overlay"/>');
                }
            }

            /*----------------------------------------------------
               DOM Building
            ---------------------------------------------------- */
            if (ie6) {
                var src = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank';
                $iframe.attr('src', src);
                $('body').append($iframe);
            } // iframe shim for ie6, to hide select elements

            $('body').append($overlay).append($self);


            /*----------------------------------------------------
               Overlay CSS stuffs
            ---------------------------------------------------- */

            // set css of the overlay
            if (opts.showOverlay) {
                setOverlayHeight(); // pulled this into a function because it is called on window resize.
                $overlay.css({ position: 'absolute', width: '100%', top: 0, left: 0, right: 0, bottom: 0, zIndex: (opts.zIndex + 2), display: 'none' });
				if (!$overlay.hasClass('lb_overlay_clear')){
                	$overlay.css(opts.overlayCSS);
                }
            }

            /*----------------------------------------------------
               Animate it in.
            ---------------------------------------------------- */

            if (opts.showOverlay) {
                $overlay.fadeIn(opts.overlaySpeed, addModal);
            } else { addModal(); }

            /*----------------------------------------------------
               Hide parent if parent specified (parentLightbox should be jquery reference to any parent lightbox)
            ---------------------------------------------------- */
            if (opts.parentLightbox) {
                opts.parentLightbox.fadeOut(200);
            }


            /*----------------------------------------------------
               Bind Events
            ---------------------------------------------------- */

            $(window).resize(setOverlayHeight)
                     .resize(setSelfPosition)
                     .scroll(setSelfPosition)
                     .keyup(observeKeyPress);
            if (opts.closeClick) {
                $overlay.click(function(e) { closeLightbox(); e.preventDefault; });
            }
            $self.delegate(opts.closeSelector, "click", function(e) {
                closeLightbox(); e.preventDefault();
            });

            

            /*--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */


            /*----------------------------------------------------
               Private Functions
            ---------------------------------------------------- */

            /* Opens the modal using the optional effect. */
            function addModal() {
                if (opts.appearEffect == 'animate') {
                    // TODO: Reuse the formatting from "setSelfPosition".
                    $self.css('zIndex', opts.zIndex + 3);
                    opts.modalCSS.left =
                            ($(window).width() - opts.modalCSS.width) / 2;
                    opts.modalCSS.top =
                            ($(window).height() - opts.modalCSS.height) / 2;
                    opts.modalCSS.marginLeft = -$self.outerWidth() / 2;
                    opts.modalCSS.marginTop = -$self.outerHeight() / 2;
                    $self.animate(
                        opts.modalCSS, opts.lightboxSpeed, opts.onLoad
                    );
                } else {
                    setSelfPosition();
                    $self[opts.appearEffect](opts.lightboxSpeed, opts.onLoad);
                }
            }

            /* Fades the overlay then unbinds events. */
            function completeClose() {
                if (opts.destroyOnClose) { $self.remove(); } else {
                    $self.hide();
                    $self.undelegate(opts.closeSelector, 'click');
                }

                if (ie6) { $self[0].style.removeExpression('top'); } // WTF?

                $overlay.fadeOut(opts.overlayDisappearSpeed, function() {
                    opts.onClose(); // Any foreground animation should go first.

                    if (opts.parentLightbox) {
                        opts.parentLightbox.fadeIn('fast');
                    }

                    opts.destroyOnClose ? $overlay.remove() : $overlay.hide();

                    if (ie6) { $iframe.remove(); }

                    $(document).unbind('keyup', observeKeyPress);
                    $(window).unbind('scroll', setSelfPosition);
                    $(window).unbind('resize', setSelfPosition);
                    $(window).unbind('resize', setOverlayHeight);
                });
            }

            /* Removes the lightbox using the optional effect. */
            function closeLightbox() {
                if (opts.disappearEffect == 'animate') {
                    $self.animate(
                        properties, opts.lightboxDisappearSpeed, completeClose
                    );
                } else {
                    $self[opts.disappearEffect](
                        opts.lightboxDisappearSpeed, completeClose
                    );
                }
            }


            /* Function to bind to the window to observe the escape/enter key press */
            function observeKeyPress(e) {
                if((e.keyCode == 27 || (e.DOM_VK_ESCAPE == 27 && e.which==0)) && opts.closeEsc) closeLightbox();
            }


            /* Set the height of the overlay
                    : if the document height is taller than the window, then set the overlay height to the document height.
                    : otherwise, just set overlay height: 100%
            */
            function setOverlayHeight() {
                if ($(window).height() < $(document).height()) {
                    $overlay.css({height: $(document).height() + 'px'});
                     $iframe.css({height: $(document).height() + 'px'}); 
                } else {
                    $overlay.css({height: '100%'});
                    if (ie6) {
                        $('html,body').css('height','100%');
                        $iframe.css('height', '100%');
                    } // ie6 hack for height: 100%; TODO: handle this in IE7
                }
            }


            /* Set the position of the modal'd window ($self)
                    : if $self is taller than the window, then make it absolutely positioned
                    : otherwise fixed
            */
            function setSelfPosition() {
                var s = $self[0].style;

                // reset CSS so width is re-calculated for margin-left CSS
                $self.css({left: '50%', marginLeft: ($self.outerWidth() / 2) * -1,  zIndex: (opts.zIndex + 3) });


                /* we have to get a little fancy when dealing with height, because lightbox_me
                    is just so fancy.
                 */

                // if the height of $self is bigger than the window and self isn't already position absolute
                if (($self.height() + 80  >= $(window).height()) && ($self.css('position') != 'absolute' || ie6)) {

                    // we are going to make it positioned where the user can see it, but they can still scroll
                    // so the top offset is based on the user's scroll position.
                    var topOffset = $(document).scrollTop() + 40;
                    $self.css({position: 'absolute', top: topOffset + 'px', marginTop: 0})
                    if (ie6) {
                        s.removeExpression('top');
                    }
                } else if ($self.height()+ 80  < $(window).height()) {
                    //if the height is less than the window height, then we're gonna make this thing position: fixed.
                    // in ie6 we're gonna fake it.
                    if (ie6) {
                        s.position = 'absolute';
                        if (opts.centered) {
                            s.setExpression('top', '(document.documentElement.clientHeight || document.body.clientHeight) / 2 - (this.offsetHeight / 2) + (blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + "px"')
                            s.marginTop = 0;
                        } else {
                            var top = (opts.modalCSS && opts.modalCSS.top) ? parseInt(opts.modalCSS.top) : 0;
                            s.setExpression('top', '((blah = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + '+top+') + "px"')
                        }
                    } else {
                        if (opts.centered) {
                            $self.css({ position: 'fixed', top: '50%', marginTop: ($self.outerHeight() / 2) * -1})
                        } else {
                            $self.css({ position: 'fixed'}).css(opts.modalCSS);
                        }

                    }
                }
            }

        });



    };

    $.fn.lightbox_me.defaults = {

        // Animation:
        appearEffect: 'fadeIn',
        overlaySpeed: 250,
        lightboxSpeed: 300,
        disappearEffect: 'fadeOut',
        overlayDisappearSpeed: 250,
        lightboxDisappearSpeed: 300,

        // Callbacks:
        onLoad: function() {},
        onClose: function() {},

        // Appearance:
        zIndex: 999,
        classPrefix: 'lb',
        overlayCSS: {background: 'black', opacity: .3},
        centered: false,
        modalCSS: {top: '40px'},

        // Behavior:
        parentLightbox: false,
        showOverlay: true,
        closeEsc: true,
        closeClick: true,
        closeSelector: '.close',
        destroyOnClose: false
    };
})(jQuery);