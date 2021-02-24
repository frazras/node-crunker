const { AudioContext } = require('web-audio-api');
const save = require('save-file');
const fetch = require('node-fetch');
const fs = require("fs");
 const util = require("util");
 const readFile = util.promisify(fs.readFile);

class NodeCrunker {
  constructor({ sampleRate = 44100 } = {}) {
    this._sampleRate = sampleRate;
    this._context = new AudioContext();
  }

  getStart(pos, len) {
    if (pos == null) return 0;
    return pos < 0 ? len + (pos % len) : Math.min(len, pos);
  }

  getEnd(pos, len) {
    if (pos == null) return len;
    return pos < 0 ? len + (pos % len) : Math.min(len, pos);
  }

  slice(buffer, start, end, duration) {
    start = this.getStart(start, buffer.length);
    end = this.getEnd(end, buffer.length);

    var data = [];
    for (var channel = 0; channel < buffer.numberOfChannels; channel++) {
      data.push(buffer.getChannelData(channel).slice(start, end));
    }
    return this.mergeData(data, duration);
  }

  async fetchAudio(...filepaths) {
    try {
      const files = filepaths.map(async filepath => {
        const buffer = await fetch(filepath).then(response =>
          response.arrayBuffer()
        );
        return await new Promise((resolve, reject) =>
          this._context.decodeAudioData(
            buffer,
            function(audioData) {
              resolve(audioData);
            },
            function(err) {
              reject(err);
            }
          )
        );
      });
      return await Promise.all(files);
    } catch (err) {
      console.log(err);
    }
  }

  async fetchLocalAudio(...filepaths) {
    try {
      const files = filepaths.map(async filepath => {
        const buffer = await readFile(filepath);
        return await new Promise((resolve, reject) =>
          this._context.decodeAudioData(
            buffer,
            function(audioData) {
              resolve(audioData);
            },
            function(err) {
              reject(err);
            }
          )
        );
      });
      return await Promise.all(files);
    } catch (err) {
      console.log(err);
    }
  }

  async fetchBuffers(...buffers) {
    try {
      const files = buffers.map(async buffer => {
        return new Promise((resolve, reject) =>
          this._context.decodeAudioData(
            buffer,
            function(audioData) {
              resolve(audioData);
            },
            function(err) {
              reject(err);
            }
          )
        );
      });
      return await Promise.all(files);
    } catch (err) {
      console.log(err);
    }
  }

  mergeData(buffers, duration) {
    let output = this._context.createBuffer(
      1,
      this._sampleRate * duration,
      this._sampleRate
    );
    buffers.map(buffer => {
      for (let i = buffer.length - 1; i >= 0; i--) {
        output.getChannelData(0)[i] += buffer[i];
      }
    });
    return output;
  }

  mergeAudio(buffers, duration) {
    let output = this._context.createBuffer(
      1,
      this._sampleRate * (duration ? duration : this._maxDuration(buffers)),
      this._sampleRate
    );

    buffers.map(buffer => {
      for (let i = buffer.getChannelData(0).length - 1; i >= 0; i--) {
        output.getChannelData(0)[i] += buffer.getChannelData(0)[i];
      }
    });
    return output;
  }

  concatAudio(buffers, duration) {
    let output = this._context.createBuffer(
      1,
      this._totalLength(buffers),
      this._sampleRate
    );
    let offset = 0;
    buffers.map(buffer => {
      output.getChannelData(0).set(buffer.getChannelData(0), offset);
      offset += buffer.length;
    });
    if (duration < output.duration) {
      return this.slice(output, 0, duration * this._sampleRate, duration);
    }
    return output;
  }

  async export(buffer, filename) {
    try {
      const recorded = this._interleave(buffer);
      const dataview = this._writeHeaders(recorded);
      return await save(dataview, filename);
    } catch (err) {
      console.log(err);
    }
  }

  async exportBuffer(buffer) {
    try {
      const recorded = this._interleave(buffer);
      const dataview = this._writeHeaders(recorded);
      return dataview.buffer;
    } catch (err) {
      console.log(err);
    }
  }

  _maxDuration(buffers) {
    return Math.max.apply(Math, buffers.map(buffer => buffer.duration));
  }

  _totalLength(buffers) {
    return buffers.map(buffer => buffer.length).reduce((a, b) => a + b, 0);
  }

  _writeHeaders(buffer) {
    let arrayBuffer = new ArrayBuffer(44 + buffer.length * 2),
      view = new DataView(arrayBuffer);

    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + buffer.length * 2, true);
    this._writeString(view, 8, 'WAVE');
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, this._sampleRate, true);
    view.setUint32(28, this._sampleRate * 4, true);
    view.setUint16(32, 4, true);
    view.setUint16(34, 16, true);
    this._writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * 2, true);

    return this._floatTo16BitPCM(view, buffer, 44);
  }

  _floatTo16BitPCM(dataview, buffer, offset) {
    for (var i = 0; i < buffer.length; i++, offset += 2) {
      let tmp = Math.max(-1, Math.min(1, buffer[i]));
      dataview.setInt16(offset, tmp < 0 ? tmp * 0x8000 : tmp * 0x7fff, true);
    }
    return dataview;
  }

  _writeString(dataview, offset, header) {
    for (var i = 0; i < header.length; i++) {
      dataview.setUint8(offset + i, header.charCodeAt(i));
    }
  }

  _interleave(input) {
    let buffer = input.getChannelData(0),
      length = buffer.length * 2,
      result = new Float32Array(length),
      index = 0,
      inputIndex = 0;

    while (index < length) {
      result[index++] = buffer[inputIndex];
      result[index++] = buffer[inputIndex];
      inputIndex++;
    }
    return result;
  }
}

module.exports = NodeCrunker;
