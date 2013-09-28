/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:17 PM
 * To change this template use File | Settings | File Templates.
 */

var Track = function(looper){

    Track.MAX_SOURCE_NODES = 10;

    var looper = looper;

    var recorder = new Recorder(looper.getSource());

    var sourceNodes = [];

    var currentSourceNode = null;

    var scheduledSourceNodes = [];

    var gain = 100;

    var pitch = 1;

    var playing = false;

    var recording = false;

    var bufferCreatedCallback = null;

    var buffer = null;

    var bufferBuilt = false;

    var lastPlayTime = 0;

    // Methods

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
        recording = false;
        bufferBuilt = false;
        bufferCreatedCallback = (callback)? callback.bind(scope) : function(){
            console.warn("No callback specified for stopRecording. Doing nothing...");
        };
        recorder.getBuffer(buildBuffer.bind(this));
    }

    this.startPlaying = function(when){

        var context = this.getContext();

        // API limitation, this node has to be created every time
        currentSourceNode = sourceNodes.splice(0, 1)[0];
        currentSourceNode.buffer = buffer;
        currentSourceNode.connect(this.getDestination());
        scheduledSourceNodes.push(currentSourceNode); // TODO Remember to stop all the scheduled nodes when registering a new sound
        currentSourceNode.playbackRate.value = pitch; // Set the pitch
        // console.log("Delay to play "+(performance.now() - debug.startTime));
        //console.log("Now is "+context.currentTime+", Playing at "+when);
        currentSourceNode.start((when)? when : 0);

        // TODO Remember to disconnect the node once it's done playing, otherwise memory leak! There's a reference from the context

        playing = true;

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
            scheduledSourceNodes[i].stop(0);
        }

        scheduledSourceNodes = [];

        playing = false;
    }

    this.setGain = function(gain){

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

    // Constructor
    for (var i = 0; i < Track.MAX_SOURCE_NODES; i++){

        var context = this.getContext();

        sourceNodes.push(context.createBufferSource());
    }

}