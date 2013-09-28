/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:08 PM
 * To change looper template use File | Settings | File Templates.
 */

var Looper = function(measureSize){

    Looper.MAX_SCHEDULED_SOUNDS = 10;

    var looper = this; // For callbacks

    var power = false;

    var looping = false;

    var measureSize = measureSize;

    var tracks = [];

    var lastPlayTimes = [];

    var numOfTracks = 5;

    var context = null;

    var nodes = {
        source : null,
        destination : null
    }

    var events = {
        loop : new CustomEvent("loop"),
        beat : new CustomEvent("beat")
    }

    var loopInterval = null;

    var beatInterval = null;

    var loopDuration = 0;

    var bpm = 0;

    var getBpmFromDuration = function(duration){
        return (60.0 * measureSize) / duration;
    }

    looper.powerOn = function(){

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

    looper.powerOff = function(){

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

    looper.getContext = function(){
        return context;
    }

    looper.getTracks = function(){
        return tracks;
    }

    looper.getSource = function(){
        return nodes.source;
    }

    looper.getDestination = function(){
        return nodes.destination;
    }


    looper.setGain = function(trackNumber, gain){

    }

    looper.insertNode = function(tag, node, trackNumber){

    }

    looper.getTrackNumber = function(track){
        if (track instanceof Track)
            return tracks.indexOf(track);
    }

    var loop = function(){
        for (var i = 0; i < numOfTracks; i++){
            if (tracks[i].isPlaying())
                scheduleTrack(tracks[i]);
        }

        // Fire the loop event
        window.dispatchEvent(events.loop);
        console.warn("LOOP");
    }

    var startLoop = function(){
        window.dispatchEvent(events.loop);
        window.dispatchEvent(events.beat);

        loopInterval = setInterval(function(){
            loop();
        }, loopDuration * 1000);

        beatInterval = setInterval(function(){
            window.dispatchEvent(events.beat);
        }, (loopDuration * 1000) / measureSize);

        looping = true;
    }


    var scheduleTrack = function(track){
        console.log(track);
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
        }

        delta = loopDuration - trackDuration;
        deltaP = delta / loopDuration;
        console.log("Difference is "+(deltaP * 100)+"%");

        // Loop quantization
        if (Math.abs(deltaP) < 0.02){
            track.setPitch(1 - deltaP);
            delta = 0;
        }

        console.log("Last play "+track.getLastPlayTime());

        // Actual scheduling
        for (var i = 1; i < Looper.MAX_SCHEDULED_SOUNDS; i++){
            when = ((track.getLastPlayTime() != 0)? track.getLastPlayTime() + trackDuration : now) + delta;
            track.startPlaying(when);
        }

        if (!looping){
            startLoop();
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

    });

}