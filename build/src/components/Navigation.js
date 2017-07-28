System.register(['rodin/core', '../data/buttons.js', './Button.js'], function (_export, _context) {
    "use strict";

    var RODIN, Icons, Button;
    return {
        setters: [function (_rodinCore) {
            RODIN = _rodinCore;
        }, function (_dataButtonsJs) {
            Icons = _dataButtonsJs.Icons;
        }, function (_ButtonJs) {
            Button = _ButtonJs.Button;
        }],
        execute: function () {

            /**
             * a class that handles view changing buttons
             */
            class Navigation {

                constructor(videoContainer) {
                    this.videoContainer = videoContainer;
                    this.buttons = [];
                    this.btnArea = new RODIN.Element({
                        name: 'buttonArea',
                        width: 0.6,
                        height: 0.2,
                        background: {
                            opacity: 0.7,
                            color: '0x008BF2'
                        },
                        border: {
                            radius: 0.2
                        }
                    });
                    this.btnArea.visible = false;
                    this.isNavigationOpen = false;
                    this.btnArea.on(RODIN.CONST.READY, e => {
                        RODIN.Scene.add(e.target);
                        this.viewChange = new RODIN.Text({ text: 'CHANGE VIEW', fontSize: 0.04, color: 0xFFFFFF });
                        this.viewChange.name = 'textChange';
                        this.viewChange._threeObject.material.visible = false;
                        this.viewChange.on(RODIN.CONST.READY, () => {
                            e.target.add(this.viewChange);
                            this.viewChange.position.y = 0.135;
                        });
                        e.target._threeObject.renderOrder = 0;
                        e.target.position.z = -2;
                        e.target.position.y = 1.1;

                        for (let i = 0; i < 3; i++) {
                            let button = new Button(.2, .2, Icons[i].name, Icons[i].path);
                            this.buttons.push(button);
                            button.active.on(RODIN.CONST.READY, evt => {
                                let btn = evt.target;
                                this.btnArea.add(btn);
                                btn.position.z = 0.02;
                                btn.position.x = -0.2 + 0.2 * i;
                                let type = new RODIN.Text({ text: evt.target.name, fontSize: 0.04, color: 0xFFFFFF });

                                type.name = 'hoverText';
                                type.on(RODIN.CONST.READY, t => {
                                    this.btnArea.visible = true;
                                    button.active.add(type);
                                    t.target.position.y = -0.13;
                                    t.target._threeObject.material.visible = false;
                                });
                                btn.on(RODIN.CONST.GAMEPAD_BUTTON_UP, e => {
                                    this.openNavigation(e);
                                });
                                btn.on(RODIN.CONST.GAMEPAD_BUTTON_DOWN, e => {
                                    this.onButtonDown(e);
                                });
                                this.setActiveButton('Linear');
                            });
                            button.active.on(RODIN.CONST.GAMEPAD_HOVER, this.onHoverAnimation.bind(this));
                            button.active.on(RODIN.CONST.GAMEPAD_HOVER_OUT, this.onHoverOutAnimation.bind(this));
                        }
                    });
                }

                onButtonDown(e) {
                    e.stopPropagation();
                    this._lastButtonDown = RODIN.Time.now;
                }

                get sculpt() {
                    return this.btnArea;
                }

                hideOrShowChangeView() {
                    this.sculpt._threeObject.material.visible = !this.sculpt._threeObject.material.visible;
                }

                setActiveButton(type) {
                    this.hideViewChange();
                    this.hideOrShowChangeView();
                    this.buttons.map(btn => {
                        Navigation.animation(btn.element, {
                            position: {
                                x: 0
                            }
                        }, 'navigationClose', 300);
                        btn.element.on(RODIN.CONST.ANIMATION_COMPLETE, e => {
                            if (e.animation === 'navigationClose') {
                                btn.element._threeObject.material.visible = btn.element.name.toLowerCase() === type.toLowerCase();
                                btn.element._threeObject.visible = btn.element.name.toLowerCase() === type.toLowerCase();
                            }
                        });
                    });
                    this.isNavigationOpen = false;
                    this.videoContainer.setView(type);
                }

                onHoverAnimation(evt) {
                    let { target } = evt;
                    Navigation.animation(target._children[1], { scale: { x: .95, y: .95, z: .95 } }, 'scaleIn', 300);
                    if (!this.isNavigationOpen) {
                        this.showViewChange();
                    }
                    target._children.map(ch => {
                        if (ch.name === 'hoverText') {
                            ch._threeObject.material.visible = true;
                        }
                    });
                }

                onHoverOutAnimation(evt) {
                    let { target } = evt;
                    Navigation.animation(target._children[1], { scale: { x: .8, y: .8, z: .8 } }, 'scaleOut', 300);
                    if (!this.isNavigationOpen) {
                        this.hideViewChange();
                    }
                    target._children.map(ch => {
                        if (ch.name === 'hoverText') {
                            ch._threeObject.material.visible = false;
                        }
                    });
                }

                openNavigation(evt) {
                    evt.stopPropagation();
                    if (RODIN.Time.now - this._lastButtonDown > 200 || RODIN.Time.now - this._lastButtonDown < 50) return;
                    if (evt.target.animation.isPlaying()) {
                        return;
                    }
                    if (this.sculpt._threeObject.material.visible) {
                        return this.setActiveButton(evt.target.name);
                    }
                    this.showNavigation();
                    this.showViewChange();
                    this.buttons.map((value, key) => {
                        value.element._threeObject.material.visible = false;
                        value.element._threeObject.visible = true;
                        Navigation.animation(value.element, {
                            position: {
                                x: -0.20 + 0.20 * key
                            }
                        }, 'navigationOpen', 300);
                        if (value.element.animation && value.element.animation.isPlaying('navigationOpen')) {
                            value.element.animation.stop('navigationOpen', false);
                            console.log('aab');
                        }
                    });
                }

                showNavigation() {
                    this.isNavigationOpen = true;
                    this.sculpt._threeObject.material.visible = true;
                }

                hideViewChange() {
                    this.viewChange._threeObject.material.visible = false;
                }

                showViewChange() {
                    this.viewChange._threeObject.material.visible = true;
                }

                static animation(obj, params, name, duration) {
                    const navigationAnimation = new RODIN.AnimationClip(name, params);
                    navigationAnimation.duration(duration);
                    obj.animation.add(navigationAnimation);
                    obj.animation.start(name);
                }
            }

            _export('Navigation', Navigation);
        }
    };
});