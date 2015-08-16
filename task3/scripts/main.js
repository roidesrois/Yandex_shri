/*
 * BeatsAlive.jS
 * Copyright (c) 2014 Gaurav Behere
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext || mozAudioContext;
var context = new AudioContext();

var audioAnimation, audioBuffer, source, sourceNode, analyser, audio, progressTimer = null,
playList = [], indexPlaying = -1, gainNode = null,
equalizer80Hz = null, equalizer240Hz = null, equalizer750Hz = null,
equalizer2200Hz = null, equalizer6000Hz = null, eqInitiated = false, audio_paused_stopped = false;


function init() {

    var filedrag = document.getElementById('playlistContainer');

    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
      // file drop
      filedrag.addEventListener('dragover', fileDragHover, false);
      filedrag.addEventListener('drop', fileSelectHandler, false);
      filedrag.style.display = 'block';
    } else {
      filedrag.style.display = 'none';
    }
  }

  // file drag hover
  function fileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.target.className = (e.type === 'dragover' ? 'hover' : '');
  }

  // file selection
  function fileSelectHandler(e) {
    // cancel event and hover styling
    fileDragHover(e);
    var droppedFiles = e.target.files || e.dataTransfer.files;

    addToPlaylist(droppedFiles);

}

  // call initialization file
  if (window.File && window.FileList && window.FileReader) {
    init();
  } else {
    alert('Your browser does not support File');
  }


/**
 * Method: loadSong
 * Sets up audio element's source, invokes audio node's setup
 * @param url
 */
function loadSong(url) {
    if (audio) audio.remove();
    if (sourceNode) sourceNode.disconnect();

    audio = new Audio();
    audio.src = url;
    audio.volume = document.getElementById('vol').value;
    audio.addEventListener("canplay", function (e) {
        setupAudioNodes();
    }, false);
}

/**
 * Initiates equalizer with preset as normal
 */
function initEQFilters() {
    // initialize eqFilters
    equalizer80Hz = context.createBiquadFilter();
    equalizer80Hz.type = 'peaking';
    equalizer80Hz.gain.value = 0;
    equalizer80Hz.Q.value = 1;
    equalizer80Hz.frequency.value = 80;

    equalizer240Hz = context.createBiquadFilter();
    equalizer240Hz.type =  'peaking';
    equalizer240Hz.gain.value = 0;
    equalizer240Hz.Q.value = 1;
    equalizer240Hz.frequency.value = 240;

    equalizer750Hz = context.createBiquadFilter();
    equalizer750Hz.type =  'peaking';
    equalizer750Hz.gain.value = 0;
    equalizer750Hz.Q.value = 1;
    equalizer750Hz.frequency.value = 750;

    equalizer2200Hz = context.createBiquadFilter();
    equalizer2200Hz.type =  'peaking';
    equalizer2200Hz.gain.value = 0;
    equalizer2200Hz.Q.value = 1;
    equalizer2200Hz.frequency.value = 2200;

    equalizer6000Hz = context.createBiquadFilter();
    equalizer6000Hz.type =  'peaking';
    equalizer6000Hz.gain.value = 0;
    equalizer6000Hz.Q.value = 1;
    equalizer6000Hz.frequency.value = 6000;
    eqInitiated = true;
}


/**
 * Connects equalizer, gain, spectrum with the audio node
 */
function setupAudioNodes() {
    analyser = (analyser || context.createAnalyser());
    source = context.createBufferSource();
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 512;

    gainNode = context.createGain();
    gainNode.gain.value = 1;
    try {
        sourceNode = context.createMediaElementSource(audio);
    }
    catch (e) {
        return;
    }
    if (eqInitiated === false)
        initEQFilters();

    sourceNode.connect(gainNode);
    gainNode.connect(equalizer80Hz);
    equalizer80Hz.connect(equalizer240Hz);
    equalizer240Hz.connect(equalizer750Hz);
    equalizer750Hz.connect(equalizer2200Hz);
    equalizer2200Hz.connect(equalizer6000Hz);
    equalizer6000Hz.connect(context.destination);

    sourceNode.connect(analyser);
    sourceNode.connect(context.destination);
    document.getElementById('progress').setAttribute('max', audio.duration);
    audio.play();
}


/**
 * Volume change event handler
 * @param e
 */
function volumeChange(e) {
    audio.volume = document.getElementById('vol').value;
}


/**
 * Method to update audio progress time in the progress bar
 */
function trackChange() {
    document.getElementById('progress').value = audio.currentTime;
    document.getElementById('progressTime').innerHTML = audio.currentTime.toString().getFormattedTime() + "/" + audio.duration.toString().getFormattedTime();
}
function progressChange() {
    //console.log("progressChange");
    clearInterval(progressTimer);
    audio.currentTime = document.getElementById('progress').value;
    progressTimer = setInterval(trackChange, 100);
}


/**
 * Audio change handler - initiates spectrum and plays audio immediately
 * as the track is changed -- Not used
 * @param that
 */
function audioChange(that) {
    var files = that.files;

    if (files.length > 0) {
        var file = window.URL.createObjectURL(files[0]);
        loadSong(file);
    }
}


/**
 * Method to remove a selected track from the playlist
 */
function removeFromPlayList() {
    var selected = document.getElementsByClassName('songItemFocused');
    if (selected.length > 0) {
        var idx = selected[0].getAttribute('index');
        if (idx == indexPlaying) {
            return;
        }
        else {
            playList.splice(idx, 1);
            if (idx < indexPlaying)
                indexPlaying--;
            displayPlayList();
        }
    }
}


/**
 * Method to add a track from the playlist
 * @param that
 */
function addToPlaylist(that) {
    var files = that;
    for (var i = 0; i < files.length; i++) {
        var songExists = false;
        for (var j = 0; j < playList.length; j++) {
            if (playList[j].name == files[i].name) {
                songExists = true;
                break;
            }
        }
        if (songExists === false) {
            playList.push(files[i]);
        }
    }
//    console.log(playList);
    displayPlayList();
}


/**
 * Displays playlist's tracks in the UI playlist pane
 */
function displayPlayList() {
    var ring = document.getElementById('playlistRing');
    ring.innerHTML = "";
    for (var i = 0; i < playList.length; i++) {
        var songItem = document.createElement('div');
        var trackName = new String(playList[i].name);
        songItem.innerHTML = trackName.substring(0, trackName.indexOf("."));
        songItem.className = "songItem";
        songItem.style.top = i * 20 + 5 + "px";
        songItem.setAttribute('index', i);
        songItem.onclick = function () {
            if (document.getElementsByClassName('songItemFocused').length > 0)
                document.getElementsByClassName('songItemFocused')[0].classList.remove('songItemFocused');
            this.classList.add('songItemFocused');
        };
        ring.appendChild(songItem);
    }
    focusNowPlaying();
}


/**
 * Audio controls's next track event handler
 */
function next() {
    if (playList[indexPlaying + 1]) {
        playAudio();
        return;
    }
}


/**
 * Audio controls's previous track event handler
 */
function previous() {
    if (playList[indexPlaying - 1]) {
        indexPlaying = indexPlaying - 2;
        playAudio();
        return;
    }
}


/**
 * Handler for audio preset change
 * @param target
 */
function presetChanged(target) {
    if (audio) {
        document.getElementsByClassName('focusedBtn')[0].classList.remove('focusedBtn');
        target.classList.add('focusedBtn');
        if (target.id == "pop") {
            equalizer80Hz.gain.value = 8.12;
            equalizer240Hz.gain.value = 3.53;
            equalizer750Hz.gain.value = 0.35;
            equalizer2200Hz.gain.value = -0.35;
            equalizer6000Hz.gain.value = 2.18;
            document.getElementById('80').value = 8.12;
            document.getElementById('240').value = 3.53;
            document.getElementById('750').value = 0.35;
            document.getElementById('2200').value = -0.35;
            document.getElementById('6000').value = 2.18;
        }
        if (target.id == "jazz") {
            equalizer80Hz.gain.value = 10.97;
            equalizer240Hz.gain.value = 3.56;
            equalizer750Hz.gain.value = -0.5;
            equalizer2200Hz.gain.value = 3.39;
            equalizer6000Hz.gain.value = 10.97;
            document.getElementById('80').value = 10.97;
            document.getElementById('240').value = 3.56;
            document.getElementById('750').value = -0.5;
            document.getElementById('2200').value = 3.39;
            document.getElementById('6000').value = 10.97;
        }
        if (target.id == "rock") {
            equalizer80Hz.gain.value = -18.00;
            equalizer240Hz.gain.value = -3.88;
            equalizer750Hz.gain.value = 6.68;
            equalizer2200Hz.gain.value = 4.44;
            equalizer6000Hz.gain.value = 5.97;
            document.getElementById('80').value = -18.00;
            document.getElementById('240').value = -3.88;
            document.getElementById('750').value = 6.68;
            document.getElementById('2200').value = 4.44;
            document.getElementById('6000').value = 5.97;
        }
        if (target.id == "classic") {
            equalizer80Hz.gain.value = -8.26;
            equalizer240Hz.gain.value = -7.56;
            equalizer750Hz.gain.value = -10.38;
            equalizer2200Hz.gain.value = 7.97;
            equalizer6000Hz.gain.value = 12.92;
            document.getElementById('80').value = -8.26;
            document.getElementById('240').value = -7.56;
            document.getElementById('750').value = -10.38;
            document.getElementById('2200').value = 7.97;
            document.getElementById('6000').value = 12.92;
        }
        if (target.id == "normal") {
            equalizer80Hz.gain.value = 0;
            equalizer240Hz.gain.value = 0;
            equalizer750Hz.gain.value = 0;
            equalizer2200Hz.gain.value = 0;
            equalizer6000Hz.gain.value = 0;
            document.getElementById('80').value = 0;
            document.getElementById('240').value = 0;
            document.getElementById('750').value = 0;
            document.getElementById('2200').value = 0;
            document.getElementById('6000').value = 0;
        }
    }
}

/**
 * Plays the audio updating the index
 */
function playAudio() {
    console.log(playList.length);
    if (playList.length > 0) {
        document.getElementById("play").style.display = "none";
        document.getElementById("stop").style.display = "block";
            console.log(audio_paused_stopped);
        if (audio_paused_stopped === true) {
            if (playList.length == 1)
                loadSong(window.URL.createObjectURL(playList[indexPlaying]));
            else
                audio.play();
            audio_paused_stopped = false;
        }
        else {
            indexPlaying++;
            loadSong(window.URL.createObjectURL(playList[indexPlaying]));
            focusNowPlaying();
        }

        mySpectrum = setInterval(drawSpectrum, 30);
        progressTimer = setInterval(trackChange, 100);
    }
}

/**
 * Audio control's stop event handler
 */
function stopAudio() {
    if (audio) {
        document.getElementById("play").style.display = "block";
        document.getElementById("stop").style.display = "none";
        audio.pause();
        audio.currentTime = 0;
        audio_paused_stopped = true;
    }
}

/**
 * UI update for play event updating the track name in the ticker
 */
function focusNowPlaying() {
    if (document.getElementsByClassName('playingSong').length > 0)
        document.getElementsByClassName('playingSong')[0].classList.remove('playingSong');
    if (document.getElementsByClassName('songItem')[indexPlaying]) {
        document.getElementsByClassName('songItem')[indexPlaying].classList.add('playingSong');
    }
}


/**
 * Handler for manual equalizer change
 * @param target
 */
function eqValueChange(target) {
    if (target.id == 80) {
        console.log("80: " + target.value);
        equalizer80Hz.gain.value = target.value;
    }
    if (target.id == 240) {
        console.log("240: " + target.value);
        equalizer240Hz.gain.value = target.value;
    }
    if (target.id == 750) {
        console.log("750: " + target.value);
        equalizer750Hz.gain.value = target.value;
    }
    if (target.id == 2200) {
        console.log("2200: " + target.value);
        equalizer2200Hz.gain.value = target.value;
    }
    if (target.id == 6000) {
        console.log("6000: " + target.value);
        equalizer6000Hz.gain.value = target.value;
    }

}

function drawSpectrum() {
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = "#FC610D";
    var width = canvas.width;
    var height = canvas.height;
    var bar_width = 10;

    ctx.clearRect(0, 0, width, height);

    var freqByteData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqByteData);

    var barCount = Math.round(width / bar_width);
    for (var i = 0; i < barCount; i++) {
        var magnitude = freqByteData[i];
        // some values need adjusting to fit on the canvas
        ctx.fillRect(bar_width * i, height, bar_width - 2, -magnitude + 60);
    }
}

/**
 * String's time display helper
 */
String.prototype.getFormattedTime = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hrs = Math.floor(sec_num / 3600);
    var mins = Math.floor((sec_num - (hrs * 3600)) / 60);
    var sec = sec_num - (hrs * 3600) - (mins * 60);
    if (hrs < 10) {
        hrs = "0" + hrs;
    }
    if (mins < 10) {
        mins = "0" + mins;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    var time = mins + ':' + sec;
    return time;
};
