/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:08 PM
 * To change looper template use File | Settings | File Templates.
 */

var Looper = function(measureSizeArg){

    Looper.MAX_SCHEDULED_SOUNDS = 10;

    var looper = this; // For callbacks

    var recorder = null;

    var power = false;

    var looping = false;

    var recording = false;

    var mute = false;

    var currentFilter = null;

    var measureSize = measureSizeArg;

    var quantizationValue = 0.05;

    var tracks = [];

    var firstTrack = null;

    var lastPlayTimes = [];

    var numOfTracks = 5;

    var context = null;

    var nodes = {
        source : null,
        destination : null,
        gain : null,
        streamer : null,
        filter : null,
        recordingSource : null
    }

    var events = {
        loop : new CustomEvent("loop", {detail: looper}),
        beat : new CustomEvent("beat"),
        effectEnabled : new CustomEvent("effectEnabled"),
        muteAll : new CustomEvent('looperMute', {detail: looper}),
        powerOff : new CustomEvent('looperPowerOff', {detail: looper}),
        powerOn : new CustomEvent('looperPowerOn', {detail: this})
    }

    var loopInterval = null;

    var beatInterval = null;

    var loopDuration = 0;

    var bpm = 0;

    var currentGain = 1;

    var getBpmFromDuration = function(duration){
        return (60.0 * measureSize) / duration;
    }

    // CONSTRUCTOR

    // Web Audio setup
    context = new AudioContext();
    console.log(context);

    nodes.destination = context.destination;
    nodes.gain = context.createGain();
    nodes.filter = context.createBiquadFilter();
    nodes.recordingSource = context.createGain();
    nodes.streamer = context.createMediaStreamDestination();

    nodes.gain.connect(nodes.destination);
    nodes.gain.connect(nodes.streamer);
    nodes.gain.connect(nodes.recordingSource);
    // Enable the streamer
    nodes.recordingSource.connect(nodes.streamer);
    // Create the recorder
    recorder = new Recorder(nodes.recordingSource);

    // Methods

    looper.powerOn = function(callback, scope){

        if (power) return;

        // Get the main input
        navigator.getUserMedia({audio : true}, function(stream){

            // Create the nodes
            nodes.source = context.createMediaStreamSource(stream);

            // Connect the nodes
            nodes.source.connect(nodes.gain);

            // Build the tracks
            for (var i = 0; i < numOfTracks; i++){
                tracks[i] = new Track(looper, i+1);
            }


            // Call the callback
            if (callback){
                callback.bind(scope)(looper);
            }
            
            try {
                window.dispatchEvent(new CustomEvent('looperPowerOn', {detail : this}));
            } catch(e){
                console.warn(e);
            }

            power = true;
        }, function(e) {
			alert("Error: " + e);
		});
    }

    looper.powerOff = function(){
        //if (!power) return;

        stopLoop();

        for (var i = 0; i < numOfTracks; i++){
            tracks[i].clear();
        }

        nodes.source.disconnect();
    
        duration = 0;
        bpm = 0;
        power = false;

        try {
            window.dispatchEvent(new CustomEvent('looperPowerOff', {detail : this}));
        } catch(e){
            console.warn(e);
        }
    }

    looper.getContext = function(){
        return context;
    }

    looper.getStreamer = function(){
        return nodes.streamer;
    }

    looper.getTracks = function(){
        return tracks;
    }

    looper.getNodes = function(){
        return nodes;
    }

    looper.getSource = function(){
        return nodes.source;
    }

    looper.getDestination = function(){
        return nodes.destination;
    }

    looper.getGainNode = function(){
        return nodes.gain;
    }

    looper.setGain = function(gain){
        nodes.gain.gain.value = gain;
    }

    looper.getGain = function(){
        return nodes.gain.gain.value;
    }

    looper.insertNode = function(tag, node){
        nodes[tag] = node;
    }

    looper.removeNode = function(tag){
        if (!nodes[tag]) console.warn("Couldn't find any node with the tag: "+tag);
        nodes[tag].disconnect();
        delete nodes[tag];
    }

    looper.getTrackNumber = function(track){
        if (track instanceof Track)
            return tracks.indexOf(track);
    }

    var loop = function(){
        // Schedule tracks
        for (var i = 0; i < numOfTracks; i++){
            if (tracks[i].isPlaying())
                scheduleTrack(tracks[i]);
        }

        // Record the next loop


        // Fire the loop event
        window.dispatchEvent(events.loop);
    }

    var beat = function(){
        window.dispatchEvent(events.beat);
    }

    var startLoop = function(){
        window.dispatchEvent(events.loop);

        loopInterval = setInterval(function(){
            loop();
        }, loopDuration * 1000);

        beatInterval = setInterval(function(){
            beat();
        }, (loopDuration * 1000) / measureSize);

        looping = true;
    }

    var stopLoop = function(){
        clearInterval(loopInterval);
        clearInterval(beatInterval);
        looping = false;
    }

    var scheduleTrack = function(track){
        // TODO Get the length of the buffer, compute the delay and start playing the track
        var now = looper.getContext().currentTime;
        var trackDuration = track.getDuration();
        var when;
        var deltaP;
        var delta;
        var pitch;
        var trackNumber = looper.getTrackNumber(track);

        // If looper is the first track build the loop
        if (!looping){
            loopDuration = trackDuration;
            bpm = (60.0 * measureSize) / loopDuration;
            firstTrack = tracks[trackNumber - 1];
        }

        delta = loopDuration - trackDuration;
        deltaP = delta / loopDuration;

        // Loop quantization
        if (false && Math.abs(deltaP) <= quantizationValue && track.getPitch() == 1){
            console.log("Changed pitch to "+(1 - deltaP)+" [Track "+looper.getTrackNumber(track)+"], difference was "+(deltaP * 100)+"%");
            track.setPitch(1 - deltaP);
            delta = 0;
        }

        // Actual scheduling
        for (var i = 1; i < Looper.MAX_SCHEDULED_SOUNDS; i++){
            when = ((track.getLastPlayTime() != 0)? track.getLastPlayTime() + trackDuration : now) + delta;
            track.startPlaying(when);
        }

        if (!looping){
            startLoop();
        }
    }

    this.startRecording = function(){
        recorder.stop();
        recorder.clear();
        recorder.record();
        recording = true;
    }

    this.stopRecording = function(callback, type, scope){
        recorder.stop();
        recording = false;
        if (type === "buffer"){
            recorder.getBuffer(callback.bind(scope));
        } else {
            recorder.exportWAV(callback.bind(scope));
        }
    }

    this.isRecording = function(){
        return recording;
    }

    this.muteAll = function(mute){
        if (mute){
            currentGain = this.getGain();
            this.setGain(0);
            for (var i = 0; i < tracks.length; i++){
                tracks[i].mute(true);
            }
        } else {
            this.setGain(currentGain);
            for (var i = 0; i < tracks.length; i++){
                tracks[i].mute(false);
            }
        }
    }

    this.setFilter = function(filterName, config){
        // TODO config is used to tweak the filter (e.g. frequency, quality, etc.)
        if (filterName != 'none' && filterName != null && currentFilter != filterName){
            nodes.filter.type = filterName;
            currentFilter = filterName;
            connectNodes([nodes.source, nodes.filter, nodes.gain, nodes.streamer]);
        } else {
            currentFilter = null;
            connectNodes([nodes.source, nodes.gain, nodes.streamer]);
        }

    }

    var connectNodes = function(nodes){
        var curNode = nodes[0];
        for (var i = 1; i < nodes.length; i++){
            if (i != nodes.length - 1){
                curNode.disconnect();
            }
            console.log("Connecting "+curNode+" to "+nodes[i]);
            curNode.connect(nodes[i]);
            curNode = nodes[i];
        }
    }

    // Events handlers

    window.addEventListener('trackToggled', function(e){

        var trackNumber = e.detail.trackNumber;

        var track = tracks[trackNumber-1];

        if (track && track.isRecording()){
            console.log("Playing track "+trackNumber);
            track.stopRecording(scheduleTrack, looper);
        } else
        if (track){
            console.log("Recording track "+trackNumber);
            track.stopPlaying();
            track.startRecording();
        }

    }.bind(this));

    window.addEventListener('looperMute', function(e){
        if (mute){
            mute = false;
            looper.muteAll(false);
        } else {
            mute = true;
            looper.muteAll(true);
        }
    }.bind(this));

    window.addEventListener('looperFilter', function(e){
        looper.setFilter(e.detail.filter);
    }.bind(this));

    window.addEventListener('changeGain', function(e){
        var toChange = e.detail.tracks;
        var amount = (e.detail.direction < 0)? -Track.GAIN_UNIT : Track.GAIN_UNIT;
        var currentTrack;
        var gainValue = 0;

        for (var i = 0; i < toChange.length; i++){
            currentTrack = tracks[toChange[i]-1];

            if (currentTrack.getGain() + amount > Track.GAIN_MAX){
                gainValue = Track.GAIN_MAX;
            } else
            if (currentTrack.getGain() + amount < Track.GAIN_MIN){
                gainValue = Track.GAIN_MIN;
            } else {
                gainValue = currentTrack.getGain() + amount;
            }

            currentTrack.setGain(gainValue);
        }
    }.bind(this));

    window.addEventListener('clearTrack', function(e){
        var track = tracks[e.detail.trackNumber - 1];
        track.clear();
    }.bind(this));

    window.addEventListener('recordLooper', function(e){
        var toRecord = e.detail.record;
        if (toRecord){
            // Clear and start recording
            recorder.stop();
            recorder.clear();
            recorder.record();
        } else {
            recorder.exportWAV(function(blob){
                Recorder.forceDownload(blob);
            });
        }
    }.bind(this));

    window.addEventListener('powerLooper', function(e){
        var on = e.detail.on;
        if (on){
            this.powerOn();
        } else {
            this.powerOff();
        }
    }.bind(this));

}
