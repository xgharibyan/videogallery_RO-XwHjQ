System.register(["rodin/core", "./Thumbnail.js"], function (_export, _context) {
    "use strict";

    var RODIN, Thumbnail;
    return {
        setters: [function (_rodinCore) {
            RODIN = _rodinCore;
        }, function (_ThumbnailJs) {
            Thumbnail = _ThumbnailJs.Thumbnail;
        }],
        execute: function () {

            /**
             * our grid view
             * @type {null}
             */
            let view = null;

            /**
             * function for changing grid's layout
             * @param thumbs
             * @param viewNumber
             */
            const setView = (thumbs, viewNumber) => {
                /**
                 * a variable for keeping our postion when changing the view
                 * @type {null}
                 */
                let lastCenter = null;

                /**
                 * remove the old view before creating a new one
                 */
                if (view && view.sculpt) {
                    RODIN.Scene.remove(view.sculpt);
                    view.sculpt = null;
                    lastCenter = view.center;
                }
                view = null;
                /**
                 * choose the type we need
                 */
                switch (viewNumber) {
                    case 0:
                        view = new RODIN.HorizontalSemiCircleGrid(7, 1, 1.1, 1.8, 3.5);
                        view.sculpt.position.set(0, 2.1, -.5);

                        break;
                    case 1:
                        view = new RODIN.HorizontalGrid(5, 2, 1.1, 1.8);
                        view.sculpt.position.set(0, 2.5, -4);

                        break;
                    case 2:
                        view = new RODIN.VerticalSemiCircleGrid(7, 3, 0.5, 1.2, 3.5);
                        view.sculpt.position.set(0, 1.35, -.5);
                        break;
                }

                view.on(RODIN.CONST.SCROLL_START, evt => {
                    // evt.stopPropagation();
                    Thumbnail.reset(view.sculpt);
                });

                view.on(RODIN.CONST.SCROLL_END, evt => {
                    evt.stopPropagation();
                });

                // events for our view
                view.onShow((elem, index, alpha) => {
                    elem.visible = true;
                });

                view.onHide((elem, index, alpha) => {
                    elem.parent = null;
                    // boxes[index] = null;
                    elem.position.set(0, 0, -5);
                    elem.visible = false;
                });

                view.setGetElement(index => {
                    if (index < 0) return;

                    if (index >= thumbs.length) return;
                    if (!thumbs[index].element) {
                        thumbs[index].draw(index);
                        thumbs[index].position.set(0, 0, -5);
                    }
                    return thumbs[index];
                });

                /**
                 * restore the old position
                 */
                // if (lastCenter)
                // view.center = lastCenter;

                /**
                 * add the view to the scene
                 */
                RODIN.Scene.add(view.sculpt);
            };
            /**
             * set linear view
             * @param thumbs
             */

            _export("setView", setView);

            function linearView(thumbs) {
                setView(thumbs, 0);
            }

            /**
             * set grid view
             * @param thumbs
             */

            _export("linearView", linearView);

            function gridView(thumbs) {
                setView(thumbs, 1);
            }

            /**
             * set cylindrical view
             * @param thumbs
             */

            _export("gridView", gridView);

            function cylindricalView(thumbs) {
                setView(thumbs, 2);
            }

            _export("cylindricalView", cylindricalView);
        }
    };
});