/**
 * Created with JetBrains WebStorm.
 * User: mardurhack
 * Date: 9/27/13
 * Time: 2:34 PM
 * To change this template use File | Settings | File Templates.
 */


var debug = {};

var MEASURE_SIZE = 8;

var peer = new Peer("weblooperroom0001", {key: 'bwipa5argudf5hfr'});

var conn = null;

var canTalk = false;

var calls = [];

var uiManager = new UIManager();

var looper = new Looper(MEASURE_SIZE);

peer.on('open', function(id){
    document.querySelector('.roomid').innerHTML += id;
});

var addAudience = function(n){
    var holder = document.querySelector('.connections .number');
    var value = holder.innerHTML;
    value = parseInt(value) + n;
    holder.innerHTML = value;

}

peer.on('call', function(call){
    calls.push(call);
    addAudience(1);

    call.on('close', function(){
        calls.splice(calls.indexOf(call), 1);
        addAudience(-1);
    });

    call.answer(looper.getStreamer().stream);

});