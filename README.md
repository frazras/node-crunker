# Node-Crunker

**Experimental, use in production with caution**

Simple way to merge, concatenate, play, export and download audio files with the NodseWeb Audio API.

## Installation

```sh
npm install node-crunker
```

## Usage

```javascript
const NodeCrunker = require('node-crunker');
const audio = new NodeCrunker();
```

### Merge example

```javascript
audio
  .fetchAudio(
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata1.mp3',
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata4.mp3'
  )
  .then(buffers => audio.mergeAudio(buffers))
  .then(merged => audio.export(merged, 'merged.mp3'))
  .catch(error => {
    console.log(error);
  });
```

### Local merge example

```javascript
audio
  .fetchLocalAudio(
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata1.mp3',
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata4.mp3'
  )
  .then(buffers => audio.mergeAudio(buffers))
  .then(merged => audio.export(merged, 'merged.mp3'))
  .catch(error => {
    console.log(error);
  });
```

### Concatenation example

```javascript
audio
  .fetchAudio(
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata1.mp3',
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata4.mp3'
  )
  .then(buffers => audio.concatAudio(buffers))
  .then(merged => audio.export(merged, 'merged.mp3'))
  .catch(error => {
    console.log(error);
  });
```

### Local concatenation example

```javascript
audio
  .fetchAudio(
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata1.mp3',
    'http://www.mp3classicalmusic.net/48Music/Chopin48/Ballata4.mp3'
  )
  .then(buffers => audio.concatAudio(buffers))
  .then(merged => audio.export(merged, 'merged.mp3'))
  .catch(error => {
    console.log(error);
  });
```

## License

MIT
