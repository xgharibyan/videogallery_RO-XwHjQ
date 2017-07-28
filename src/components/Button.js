import * as RODIN from 'rodin/core';

/**
 * A class for our navigation buttons
 */
export class Button {
    constructor(width, height, name, image) {
        this.width = width;
        this.height = height;
        this.name = name;
        this.image = image;
        this.isClicked = false;
        this.draw();
    }

    /**
     * renders the button
     */
    draw() {
        // we use a plane for our buttons
        this.element = new RODIN.Plane(this.width, this.height, new THREE.MeshBasicMaterial({
            transparent: true,
            map: RODIN.Loader.loadTexture('./src/assets/icons/Button_background_short.png')
        }));
        this.element._threeObject.renderOrder = 1;
        this.element._threeObject.material.visible = false;
        this.element.name = this.name;
        this.glow = new RODIN.Plane(this.width, this.height, new THREE.MeshBasicMaterial({
            transparent: true,
            map: RODIN.Loader.loadTexture('./src/assets/icons/Button_glow.png')
        }));
        this.glow._threeObject.renderOrder = 2;
        this.button = new RODIN.Element({
            name: this.name,
            width: this.width,
            height: this.height,
            background: {
                image: {
                    url: this.image
                }
            },
            border: {
                radius: this.width / 2
            },
            ppm: 2000,
            transparent: true
        });

        this.button.on(RODIN.CONST.READY, btn => {
            this.element.position.z = 0.005;
            this.element.add(this.glow);
            this.glow.position.z = 0.006;
            this.glow.scale.set(0.8, .8, .8);
            this.element.add(btn.target);
            btn.target._threeObject.renderOrder = 3;
            btn.target.scale.set(.8, .8, .8);
            btn.target.position.z = 0.02;
        });
    }

    get active() {
        return this.element;
    }
}