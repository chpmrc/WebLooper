/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:34 PM
 * To change this template use File | Settings | File Templates.
 */


var debug = {};

const MEASURE_SIZE = 8;

var peer = new Peer("weblooperroom", {key: 'bwipa5argudf5hfr'});

var conn = null;

var canTalk = false;

peer.on('open', function(id){
    document.querySelector('.roomid').innerHTML += id;
});

peer.on('connection', function(connection){
    document.querySelector('.connections').innerHTML += " Client connected!";

    conn = connection;
    conn.on('open', function(){
        canTalk = true;
    });

});

var uiManager = new UIManager();

var looper = new Looper(MEASURE_SIZE);

looper.powerOn();

/** WebRTC TEST */
/**
window.addEventListener('loop', function(e){
    if (!looper.isRecording()){
        console.log("Recording looper...");
        looper.startRecording();
    } else {
        console.log("...And stopping looper");
        looper.stopRecording(function(data){
            console.log("Sending data...");
            conn.send(data);
        });
    }
}); */
