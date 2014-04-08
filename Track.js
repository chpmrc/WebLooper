/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:17 PM
 * To change this template use File | Settings | File Templates.
 */

var Track = function(looper, trackNumber){

    Track.MAX_SOURCE_NODES = 10;

    var looper = looper;

    var recorder = new Recorder(looper.getNodes().gain);

    var number = trackNumber;

    var sourceNodes = [];

    var currentSourceNode = null;

    var scheduledSourceNodes = [];

    var currentGain = 1;

    var pitch = 1;

    var playing = false;

    var recording = false;

    var bufferCreatedCallback = null;

    var buffer = null;

    var bufferBuilt = false;

    var lastPlayTime = 0;

    var events = {
        playing : new CustomEvent("playingTrack", {detail : {track : this}}),
        recording : new CustomEvent("recordingTrack", {detail : {track : this}}),
        gainChanged : new CustomEvent("gainChanged",  {detail : {track : this}}),
        trackCleared : new CustomEvent('trackCleared', {detail : {track : this}})
    }

    var nodes = {
        gain : null
    }

    // Methods

    this.getNumber = function(){
        return number;
    }

    this.isPlaying = function(){
        return playing;
    }

    this.isRecording = function(){
        return recording;
    }

    this.getContext = function(){
        return looper.getContext();
    }

    this.getDestination = function(){
        return looper.getDestination();
    }

    this.startRecording = function(){
        recorder.clear();
        recorder.record();
        recording = true;
        window.dispatchEvent(events.recording);
    }

    this.mute = function(mute){
        if (mute){
            currentGain = nodes.gain.gain.value;
            nodes.gain.gain.value = 0;
        } else {
            nodes.gain.gain.value = currentGain;
        }
    }

    this.clear = function(){
        this.stopRecording();
        this.stopPlaying();
        buffer = null;
        window.dispatchEvent(events.trackCleared);
    }

    var buildBuffer = function(channelsData){

        var context = this.getContext();

        if (!bufferBuilt){
            buffer = context.createBuffer(2, channelsData[0].length, context.sampleRate);
            buffer.getChannelData(0).set(channelsData[0]);
            buffer.getChannelData(1).set(channelsData[1]);
            bufferBuilt = true;
        }

        bufferCreatedCallback(this);
    }

    this.stopRecording = function(callback, scope){
        if (!this.isRecording()) return;
        recorder.stop();
        // TODO Remove debug structure
        recording = false;
        bufferBuilt = false; // rebuild the buffer
        lastPlayTime = 0; // reset the last time this track was played
        pitch = 1; // reset the pitch
        bufferCreatedCallback = (callback)? callback.bind(scope) : function(){
            console.warn("No callback specified for stopRecording. Doing nothing...");
        };
        window.dispatchEvent(events.recording);
        recorder.getBuffer(buildBuffer.bind(this));
    }

    this.startPlaying = function(when){

        var context = this.getContext();
        var gain = nodes.gain;
        var destination = this.getDestination();

        // API limitation, this node has to be created every time
        currentSourceNode = sourceNodes.splice(0, 1)[0];
        currentSourceNode.buffer = buffer;
        currentSourceNode.connect(nodes.gain); // TODO connect to local gain
        nodes.gain.connect(looper.getNodes().recordingSource);
        nodes.gain.connect(destination);
        scheduledSourceNodes.push(currentSourceNode); // TODO Remember to stop all the scheduled nodes when registering a new sound
        currentSourceNode.playbackRate.value = pitch; // Set the pitch
        currentSourceNode.start((when)? when : 0);


        // TODO Remember to disconnect the node once it's done playing, otherwise memory leak! There's a reference from the context

        playing = true;
        window.dispatchEvent(events.playing);

        lastPlayTime = when;

        // Create new nodes if we're running out of them
        // TODO Find a good tradeoff (make it configurable)
        // console.log("Remaining nodes: "+sourceNodes.length, "Maximum nodes: "+Track.MAX_SOURCE_NODES);
        if (sourceNodes.length < (Track.MAX_SOURCE_NODES) / 2){
            // console.log("Creating new nodes");
            for (var i = 0; i < (Track.MAX_SOURCE_NODES - sourceNodes.length); i++){
                sourceNodes.push(context.createBufferSource());
            }
        }
    }

    this.getLastPlayTime = function(){
        return lastPlayTime;
    }

    this.stopPlaying = function(){

        if (currentSourceNode){
            currentSourceNode.stop(0);
            currentSourceNode = null;
        }

        for (var i = 0; i < scheduledSourceNodes.length; i++){
            try {
				scheduledSourceNodes[i].stop(0);
			} catch (e){
				console.log("Called stop on source node " + i + " more than once. No big deal.");
			}
        }

        scheduledSourceNodes = [];

        playing = false;
        window.dispatchEvent(events.playing);
    }

    this.setGain = function(gain){
        nodes.gain.gain.value = gain;
        window.dispatchEvent(events.gainChanged);
    }

    this.getGain = function(){
        return nodes.gain.gain.value;
    }

    this.insertNode = function(node){

    }

    this.buildBuffer = function(){

    }

    this.getDuration = function(){
        return buffer.duration;
    }

    this.setPitch = function(newPitch){
        pitch = newPitch;
    }

    this.getPitch = function(){
        return pitch;
    }

    // Constructor
    for (var i = 0; i < Track.MAX_SOURCE_NODES; i++){

        var context = this.getContext();

        sourceNodes.push(context.createBufferSource());
    }

    nodes.gain = context.createGainNode();

}

Track.GAIN_UNIT = 0.1;
Track.GAIN_MAX = 1;
Track.GAIN_MIN = 0;
