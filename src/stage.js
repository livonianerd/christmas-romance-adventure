import Phaser from 'phaser';
import { drawWorld, HEIGHT, WIDTH } from './art.js';
import { WorldState } from './world.js';

export class Stage extends WorldState {
  constructor() {
    super();
    const stage = this;
    class PictureScene extends Phaser.Scene {
      create() {
        this.picture = this.textures.createCanvas('evergreen-picture', WIDTH, HEIGHT);
        this.add.image(0,0,'evergreen-picture').setOrigin(0);
        this.picture.context.imageSmoothingEnabled = false;
      }

      update(_time, delta) {
        stage.update(Math.min(delta,50));
        if (!stage.dirty && stage.reduced && !stage.active && !stage.eventAnimating) return;
        drawWorld(this.picture.context,stage.snapshot());
        stage.dirty = false;
      }
    }
    this.game = new Phaser.Game({
      type:Phaser.CANVAS, width:WIDTH, height:HEIGHT, parent:'world',
      pixelArt:true, transparent:false, audio:{ noAudio:true }, banner:false,
      fps:{target:60}, scene:[PictureScene]
    });
  }
}
