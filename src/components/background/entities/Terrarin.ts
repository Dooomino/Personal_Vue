import * as THREE from 'three';

export class Terrarin {
  width : number;
  maxDepth : number;
  grid : Array<Array<number>>;
  resolution : Array<number>;
  constructor(width: number, maxDepth: number,resoltion: Array<number>) {
    this.width = width;
    this.maxDepth = maxDepth;
    this.resolution = resoltion;
    this.grid = Array.from({ length: width }, () => Array.from({ length: width }, () => 0));
  }

  getGridMesh(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.width, this.width, this.width - 1, this.width - 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }
}
