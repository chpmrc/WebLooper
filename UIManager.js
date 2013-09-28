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

    window.addEventListener('keypress', function(e){

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
}