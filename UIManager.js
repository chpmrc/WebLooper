var UIManager = function(){

    // Initialization

    this.callbacks = {};

    this.events = {

        trackToggled : 'trackToggled',

        gainPressed : 'gainPressed',

        looperMute : 'looperMute',

        looperFilter : 'looperFilter',

        looperEffect : 'looperEffect'

    };

    this.keyCodes = {

        tracks : [49, 50, 51, 52, 53], // record/play

        gains : [81, 87, 51, 52, 53], // change globalGain

        filters : [122, 120], // enable/disable filters

        looperMute : [109] // muteAll looper's output (all tracks)
    }

    this.keysFiltersMap = {
        122 : 'lowpass',
        120 : 'highpass'
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

    var pressedKeys = [];

    window.addEventListener('keydown', function(e){
        pressedKeys.push(e.keyCode);
    });

    window.addEventListener('keyup', function(e){
        var keyIndex = pressedKeys.indexOf(e.keyCode);
        if (keyIndex != -1){
            pressedKeys.splice(keyIndex, 1);
        }
    });

    window.addEventListener('keypress', function(e){

        debug.startTime = performance.now();

        var data = {};

        // Recording/Playing tracks
        if (this.keyCodes.tracks.indexOf(e.keyCode) != -1){
            data.trackNumber = getTrackNumberByKey(e.keyCode);
            window.dispatchEvent(new CustomEvent(this.events.trackToggled, {detail : data}));
        }

        else

        if (this.keyCodes.looperMute.indexOf(e.keyCode) != -1){
            window.dispatchEvent(new CustomEvent(this.events.looperMute, {detail : data}));
        }

        else

        if (this.keyCodes.filters.indexOf(e.keyCode) != -1){
            window.dispatchEvent(new CustomEvent(this.events.looperFilter, {detail : {filter : this.keysFiltersMap[e.keyCode]}}));
        }


    }.bind(this));

    // To UI events

    var loopLed = document.querySelector('#loop-led');
    var beatLed = document.querySelector('#beat-led');
    var trackLabels = document.querySelectorAll('.track-status span');
    var trackSliders = document.querySelectorAll('.track-container input');
    var muteLabel = document.querySelector('#muteLabel');
    var filterLabels = document.querySelectorAll('.filterLabel');

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

    var muteLabelStatuses = {
        muted : 'label-warning'
    }

    var filterLabelStatuses = {
        enabled : 'label-success'
    }

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


    window.addEventListener('recordingTrack', function(e){
        var trackNumber = e.detail.track.getNumber();
        var statusIndex = trackNumber- 1; // In the dom tracks are 0...n-1
        var trackLabel = trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.recording);
    });

    window.addEventListener('playingTrack', function(e){
        var trackNumber = e.detail.track.getNumber();
        var statusIndex = trackNumber - 1; // In the dom tracks are 0...n-1
        var trackLabel = trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.playing);
    });

    window.addEventListener('looperMute', function(e){
        muteLabel.classList.toggle(muteLabelStatuses.muted);
    });

    window.addEventListener('looperFilter', function(e){
        for (var i = 0; i < filterLabels.length; i++){
            if (filterLabels[i].getAttribute('id') != e.detail.filter){
                filterLabels[i].classList.remove(filterLabelStatuses.enabled);
            } else {
                filterLabels[i].classList.toggle(filterLabelStatuses.enabled);
            }
        }
    });

    window.addEventListener('mousescroll', function(e){
         
    });
}