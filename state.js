export class State {
  constructor(boxSize, sequence, initialSlice) {
    this.boxSize = Math.min(Math.abs(parseInt(boxSize)) || 16, 400);
    this.sequence = sequence || '';
    this.slice = Math.min(Math.abs(parseInt(initialSlice) || 13), 400);
    this.showEven = true;
    this.showOdd = true;
    this.showX = true;
    this.showY = true;
    this.showZ = true;
    this.showDiagonal = true;
    this.showLowerDiagonal = true;
    this.showNear = false;
    this.showFar = true;
    this.showXyzAsCubes = false;
  }

  static load() {
    console.log("load");
    const hash = window.location.hash.substring(1, window.location.hash.length);
    const parts = hash.split(',');
    const map = new Map();
    for (let part in parts) {
      const kv = parts[part].split('=');
      if (kv.length == 2) {
        map.set(kv[0], kv[1]);
      }
    }
    return new State(map.get('lim'), map.get('seq'), map.get('sl'));
  }

  save() {
    window.location.hash = `lim=${this.boxSize},sl=${this.slice}`;
  }

  increaseSlice() {
    this.slice += 1;
  }
  decreaseSlice() {
    this.slice -= 1;
  }
  getSequence() {
    return (this.sequence || '').replace(/[^01]/g, '').split('').map(x => parseInt(x));
  }
}
