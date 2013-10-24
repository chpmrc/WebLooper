var UIManager = function(){

    // Initialization

    // Get the elements of the UI we're interested in
    this.uiElements = {
        powerBtn : document.querySelector('#powerBtn'),
        loopLed : document.querySelector('#loop-led'),
        beatLed : document.querySelector('#beat-led'),
        trackLabels : document.querySelectorAll('.track-status span'),
        trackSliders : document.querySelectorAll('.track-container input'),
        muteLabel : document.querySelector('#muteLabel'),
        filterLabels : document.querySelectorAll('.filterLabel'),
        recordBtn : document.querySelector('#recordBtn')
    };

    
    this.events = {

        trackToggled : 'trackToggled',

        gainPressed : 'gainPressed',

        looperMute : 'looperMute',

        looperFilter : 'looperFilter',

        looperEffect : 'looperEffect',

        clearTrack : 'clearTrack',

        recordLooper : 'recordLooper',

        powerLooper : 'powerLooper'

    };

    var keyCodes = {

        tracks : [49, 50, 51, 52, 53], // record/play

        gains : [81, 87, 69, 82, 84], // change gain of each track

        filters : [122, 120], // enable/disable filters

        looperMute : [109], // muteAll looper's output (all tracks)

        clearTrack : [48] // clear track
    }

    var keysFiltersMap = {
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

    /* From UI events */

    var pressedKeys = [];

    window.addEventListener('keydown', function(e){
        if (pressedKeys.indexOf(e.keyCode) == -1)
            pressedKeys.push(e.keyCode);
    });

    window.addEventListener('keyup', function(e){
        var keyIndex = pressedKeys.indexOf(e.keyCode);
        if (keyIndex != -1){
            pressedKeys.splice(keyIndex, 1);
        }
    });

    window.addEventListener('keypress', function(e){

        var data = {};

        // Recording/Playing tracks
        if (keyCodes.tracks.indexOf(e.keyCode) != -1){
            data.trackNumber = getTrackNumberByKey(e.keyCode);

            // Check if we have to perform other actions on the track
            if (pressedKeys.indexOf(keyCodes.clearTrack[0]) != -1){
                this.dispatchEvent(this.events.clearTrack, data);
            } else {
                // Otherwise just record/play
                this.dispatchEvent(this.events.trackToggled, data);
            }
        }

        else

        if (keyCodes.looperMute.indexOf(e.keyCode) != -1){
            this.dispatchEvent(this.events.looperMute, data);
        }

        else

        if (keyCodes.filters.indexOf(e.keyCode) != -1){
            this.dispatchEvent(this.events.looperFilter, {filter : keysFiltersMap[e.keyCode]});
        }


    }.bind(this));

    window.addEventListener('mousewheel', function(evt){
        // Detect scrolling direction
        var direction = evt.wheelDeltaY;
        var keys = keyCodes.gains;
        var trackIndex;
        var tracks = [];

        for (var i = 0; i < keys.length; i++){
            if (pressedKeys.indexOf(keys[i]) != -1){
                tracks.push(i+1);
            }
        }

        if (tracks.length > 0){
            this.dispatchEvent('changeGain', {
                tracks : tracks,
                direction : direction
            });
        }

    }.bind(this));

    this.uiElements.recordBtn.addEventListener('click', function(e){
        var recordBtn = e.target;
        if (!this.uiElements.recordBtn.classList.contains('btn-danger')){
            this.dispatchEvent(this.events.recordLooper, {record: true});
            this.uiElements.recordBtn.classList.toggle('btn-danger');
            this.uiElements.recordBtn.innerHTML = "Export...";
        } else {
            this.dispatchEvent(this.events.recordLooper, {record: false});
            this.uiElements.recordBtn.classList.toggle('btn-danger');
            this.uiElements.recordBtn.innerHTML = "Record";
        }
    }.bind(this));

    this.uiElements.powerBtn.addEventListener('click', function(e){
        var powerBtn = e.target;
        if (!this.uiElements.powerBtn.classList.contains('active')){
            this.uiElements.powerBtn.classList.toggle('active');
            this.uiElements.powerBtn.classList.toggle('btn-success');
            this.uiElements.powerBtn.innerHTML = "ON";
            this.dispatchEvent(this.events.powerLooper, {on: true});
        } else {
            this.uiElements.powerBtn.classList.toggle('active');
            this.uiElements.powerBtn.classList.toggle('btn-success');         
            this.uiElements.powerBtn.innerHTML = "OFF";
            this.dispatchEvent(this.events.powerLooper, {on: false});
        }
    }.bind(this));

    /* To UI events */

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
        muted : 'label-success'
    }

    var filterLabelStatuses = {
        enabled : 'label-success'
    }

    window.addEventListener('loop', function(e){
        this.uiElements.loopLed.src = ledSrc.green;
        setTimeout(function(){
            this.uiElements.loopLed.src = ledSrc.black;
        }.bind(this), 100);
    }.bind(this));

    window.addEventListener('beat', function(e){
        this.uiElements.beatLed.src = ledSrc.red;
        setTimeout(function(){
            this.uiElements.beatLed.src = ledSrc.black;
        }.bind(this), 100);
    }.bind(this));


    window.addEventListener('recordingTrack', function(e){
        var trackNumber = e.detail.track.getNumber();
        var statusIndex = trackNumber- 1; // In the dom tracks are 0...n-1
        var trackLabel = this.uiElements.trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.recording);
    }.bind(this));

    window.addEventListener('playingTrack', function(e){
        var trackNumber = e.detail.track.getNumber();
        var statusIndex = trackNumber - 1; // In the dom tracks are 0...n-1
        var trackLabel = this.uiElements.trackLabels[statusIndex];

        trackLabel.classList.remove(trackLabel.classList[1]);
        trackLabel.classList.toggle(trackStatuses.playing);
    }.bind(this));

    window.addEventListener('looperMute', function(e){
        this.uiElements.muteLabel.classList.toggle(muteLabelStatuses.muted);
    }.bind(this));

    window.addEventListener('looperFilter', function(e){
        var filterLabels = this.uiElements.filterLabels;
        for (var i = 0; i < this.uiElements.filterLabels.length; i++){
            if (filterLabels[i].getAttribute('id') != e.detail.filter){
                filterLabels[i].classList.remove(filterLabelStatuses.enabled);
            } else {
                filterLabels[i].classList.toggle(filterLabelStatuses.enabled);
            }
        }
    }.bind(this));

    window.addEventListener('gainChanged', function(e){
        var track = e.detail.track;
        var number = track.getNumber();
        var sliderId = 'track'+number;

        var slider = document.querySelector('#'+sliderId+' input');

        slider.setAttribute('value', parseInt(track.getGain()*100));
    }.bind(this));

    window.addEventListener('trackCleared', function(e){
        var track = e.detail.track;
        var number = track.getNumber();
        this.uiElements.trackLabels[number-1].classList.toggle(trackStatuses.playing);
    }.bind(this));

    window.addEventListener('looperPowerOff', function(e){
        var filterLabels = this.uiElements.filterLabels;

        for (var i = 0; i < this.uiElements.trackSliders; i++){
            this.uiElements.trackSliders[i].value = 100;
        }

        this.uiElements.muteLabel.classList.remove('label-success');

        for (var i = 0; i < filterLabels.length; i++){
            filterLabels[i].classList.remove('label-warning');
        }
        if (this.uiElements.recordBtn.classList.contains('btn-danger')){
            this.uiElements.recordBtn.click();
        }
    }.bind(this));


}