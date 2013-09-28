var UIManager = function(){

    // Initialization

    this.callbacks = {};

    this.events = {

        trackToggled : 'trackToggled',

        gainPressed : 'gainPressed'

    };

    this.keyCodes = {

        tracks : [49, 50, 51, 52, 53], // record/play

        gains : [81, 87, 51, 52, 53] // change gain
    }


    this.registerForEvent = function(eventName, callback, scope){

        this.callbacks[eventName] = this.callbacks[eventName] || [];

        this.callbacks[eventName].push(callback.bind(scope)); // Bind the scope for this

    }

    this.dispatchEvent = function(eventName, data){

        var e = new CustomEvent(eventName, { detail : data});

        window.dispatchEvent(e);

    }

    var getTrackNumberByKey = function(keyCode){

        var numbersOffset = 48;

        var validNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        var trackNumber = keyCode - numbersOffset;

        if (validNumbers.indexOf(trackNumber) != -1){
            return trackNumber;
        } else {
            return -1;
        }
    }

    // From UI events

    window.addEventListener('keypress', function(e){

        debug.startTime = performance.now();

        var data = {};

        // Recording/Playing tracks
        if (this.keyCodes.tracks.indexOf(e.keyCode) != -1){
            data.trackNumber = getTrackNumberByKey(e.keyCode);
            window.dispatchEvent(new CustomEvent(this.events.trackToggled, {detail : data}));
        }

        else

        if (this.keyCodes.gains.indexOf(e.keyCode) != -1){
            // TODO Wait for scrolling event
        }

    }.bind(this));

    // To UI events

    /**
     * All the keys that are currently down
     */

    var ledSrc = {
        green :  'resources/ui/ledgreen.png',
        black :  'resources/ui/ledblack.png',
        red :  'resources/ui/ledred.png'
    };

    var trackStatuses = {
        recording : 'label-important',
        playing : 'label-success',
        disabled : ''
    };

    var loopLed = document.querySelector('#loop-led');
    var beatLed = document.querySelector('#beat-led');
    var trackLabels = document.querySelectorAll('.track-status span');
    var trackSliders = document.querySelectorAll('.track-container input');

    window.addEventListener('loop', function(e){
        loopLed.src = ledSrc.green;
        setTimeout(function(){
            loopLed.src = ledSrc.black;
        }, 100);
    });

    window.addEventListener('beat', function(e){
        beatLed.src = ledSrc.red;
        setTimeout(function(){
            beatLed.src = ledSrc.black;
        }, 100);
    });


    window.addEventListener('playing', function(e){
        var trackNumber = e.detail.trackNumber;
        var statusIndex = trackNumber - 1; // In the dom tracks are 0...n-1
        var trackLabel = trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.playing);
    });

    window.addEventListener('recording', function(e){
        var trackNumber = e.detail.trackNumber;
        var statusIndex = trackNumber- 1; // In the dom tracks are 0...n-1
        var trackLabel = trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.recording);
    });
}