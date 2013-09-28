/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:08 PM
 * To change this template use File | Settings | File Templates.
 */

var Looper = function(measureSize){

    var power = false;

    var measureSize = measureSize;

    var tracks = [];

    var numOfTracks = 5;

    var context = null;

    var nodes = {

        source : null,

        destination : null

    }

    var duration = 0;

    var bpm = 0;

    var getBpmFromDuration = function(duration){
        return (60.0 * measureSize) / duration;
    }

    this.powerOn = function(){

        if (power) return;

        // Web Audio setup
        context = new AudioContext();

        // Get the main input
        navigator.getUserMedia({audio : true}, function(stream){
            nodes.source = context.createMediaStreamSource(stream);
            nodes.destination = context.destination;

            nodes.source.connect(nodes.destination);

            // Build the tracks
            for (var i = 0; i < numOfTracks; i++){
                tracks[i] = new Track(looper);
            }
        });

        power = true;
    }

    this.powerOff = function(){

        if (!power) return;

        for (var i = 0; i < numOfTracks; i++){
            tracks[i].stopRecording();
            tracks[i].stopPlaying();
        }

        tracks = [];

        nodes.source.disconnect();

        nodes = {};

        duration = 0;

        bpm = 0;

        power = false;

    }

    this.getContext = function(){
        return context;
    }

    this.getTracks = function(){
        return tracks;
    }

    this.getSource = function(){
        return nodes.source;
    }

    this.getDestination = function(){
        return nodes.destination;
    }

    this.startRecording = function(trackNumber, when){
        // TODO If this is the first recorded track start the loop

    }

    this.stopRecording = function(trackNumber, when){

    }

    this.startPlaying = function(trackNumber, when){

    }

    this.stopPlaying = function(trackNumber, when){

    }

    this.setGain = function(trackNumber, gain){

    }

    this.insertNode = function(tag, node, trackNumber){

    }

    this.getTrackNumber = function(track){
        if (track instanceof Track)
            return tracks.indexOf(track);
    }


    var scheduleTrack = function(track){
        console.log(track);
        // TODO Get the length of the buffer, compute the delay and start playing the track

        track.startPlaying(0);

    }

    // Events handlers

    window.addEventListener('trackToggled', function(e){

        var trackNumber = e.detail.trackNumber;

        var track = tracks[trackNumber];

        if (track && track.isRecording()){
            console.log("Playing track "+trackNumber);
            track.stopRecording(scheduleTrack, this);
        } else
        if (track){
            console.log("Recording track "+trackNumber);
            track.stopPlaying();
            track.startRecording();
        }

    });

}