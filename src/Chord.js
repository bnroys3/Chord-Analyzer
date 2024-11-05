class Chord {

    constructor(notes) {
        this.notes = notes;

        //sort the notes, this will be useful if more notes are there than supported
        //and for determining the bass note
        this.notes.sort(function(note1, note2) {
            return note1.chromaticIndex - note2.chromaticIndex;
        });

        this.numNotes = notes.length;

        //assign the chord a name if there are notes, by first determining bass note and chord quality
        if(this.numNotes > 0){
            this.bassNote = notes[0];
            this.quality = this.determineQuality(this);
            this.name = this.determineName(this.bassNote.tone, this.quality);
        } else {
            this.bassNote = "";
            this.quality = "";
            this.name = "";
        }
    }

    removeUpper(notes, numberToRemove){

        //remove the top notes, already sorted
        for(let i = 0; i < numberToRemove; i ++){
            notes.pop();
        }

        this.numNotes-=numberToRemove;
    }

    //this method inputs a quality in the form of "+{offset}{quality}/"
    //where {offset} is the number of semitones that the chord root is above the bassnote
    resolveInversion(chord, quality){
        var rootOffsetToFind;
        var offsetDigits=1;
        
        //check if the offset is 10 or 11 first for getting this quantity
        if(quality[1]==="1" && (quality[2]==="0"||quality[2]==="1")) {
            offsetDigits=2;
        }
        
        //extract the offset from the string
        rootOffsetToFind = Number(quality.substr(1,offsetDigits));

        var newRoot = "";
        var i = 0;
        
        //look for the note that, in the proper octave, is the correct number of semitones (offset) above bass note
        while(newRoot===""){

            //number of semitones above bass note
            let stepsFromRoot = chord.notes[i].chromaticIndex-chord.bassNote.chromaticIndex;

            //number of semitones above bass note in octave
            let interval = stepsFromRoot%12;

            //set the root tone when found
            if(interval===rootOffsetToFind){
                newRoot = chord.notes[i].tone;
            }
            i++;
        }

        //append the root name to the quality so that we have "{rootname}{quality}/"
        //bass note is preserved so that it can be concatenated later to result in the chord name
        return newRoot+quality.substring(offsetDigits+1);
    }

           
    determineChordTones(chord){
        //find unique chord tones

        let noteIntervals = [];

        //iterate through the notes
        for(var i = 0; i < chord.numNotes; i++){

            //find the number of semitones from the bass note
            let stepsFromRoot = chord.notes[i].chromaticIndex-chord.bassNote.chromaticIndex;

            //modulate by 12 to find number of semitones from the root if it were in same octave (like scale degree)
            let interval = stepsFromRoot%12;

            //add this interval if it is unique
            //chord name is agnostic to which octave the relevant notes are played in (besides the root/bass note)
            if(noteIntervals.indexOf(interval)===-1) {
                noteIntervals.push(interval);
            }
        }

        //remove highest notes if we have more than the number of supported unique tones in the chord
        if(noteIntervals.length > 4){

            //this will be performed multiple times if the notes removed are not unique tones
            this.removeUpper(chord.notes, noteIntervals.length-4);
            return this.determineChordTones(this);
        }
        return noteIntervals;
    }

    determineQuality(chord){

        //chord quality is determined bassed on chord tones
        //i.e. the half steps from the root note
        var noteIntervals = this.determineChordTones(chord);

        //sort the note intervals to handle voicings (upper note inversions)
        noteIntervals.sort(function(a, b) {
            return a-b;
        });

        var uniqueTones = noteIntervals.length;
        var quality;

        //call method based on numbre of unique tones in chord
        switch(uniqueTones) {
            case 0:
                quality = ""
                break;
            case 1:
                if(chord.numNotes>1) {
                    quality = " octave";
                    break;
                }
                quality = " note";
                break;
            case 2:
                quality = this.determineInterval(noteIntervals);
                break;
            case 3:
                quality = this.determineTriad(noteIntervals);

                //if a slash chord was returned, to get the root note
                if(quality[0]==="+") {
                    quality = this.resolveInversion(chord, quality);
                }
                break;
            case 4:
                quality = this.determineQuarad(noteIntervals);

                //if a slash chord was returned, to get the root note
                if(quality[0]==="+") {
                    quality = this.resolveInversion(chord, quality);
                }
                break;
            default:

                //4 notes used if there are more
                quality = this.determineQuarad(noteIntervals);

                //if a slash chord was returned, to get the root note
                if(quality[0]==="+") {
                    quality = this.resolveInversion(chord, quality);
                }
                //remove no 3
                if(quality.indexOf(" (no 3)")!==-1){
                    let temp = quality.substring(0,quality.indexOf(" (no 3)"));
                    if(quality[quality.length-1]=="/"){
                        temp+="/";
                    }
                    quality=temp;
                }
                break;
        }
        return quality;
    }

    determineInterval(interval) {

        //take the distance between the two notes
        var intervalSteps = (interval[1]-interval[0]);

        //case by case intervals are named as chords
        switch(intervalSteps) {
            case 1:
                return "addb9";
            case 2:
                return "2";
            case 3:
                return "m";
            case 4:
                return "";
            case 5:
                return "sus4";
            case 6:
                return " tritone";
            case 7:
                return "5";
            case 8:
                return "5# (no 3)";
            case 9:
                return "6 (no 3)";
            case 10:
                return "7 (no 3)";
            case 11:
                return "maj7 (no 3)";
            default:
                return "";
        }
    }

    determineTriad(noteIntervals) {
        var chordQuality;

        //the triad quality is determined by looking at the intervals between each of the 3 notes
        //after they have been adjusted to be in the same octave with the bassnote as index 0
        switch(noteIntervals[1]) {
            case 1:
                switch(noteIntervals[2]) {
                    case 2:
                        chordQuality = "2b9";
                        break;
                    case 3:
                        chordQuality = "mb9";
                        break;
                    case 4:
                        chordQuality = "addb9";
                        break;
                    case 5:
                        chordQuality = "+1maj7/"
                        break;
                    case 6:
                        chordQuality = "b5b9"
                        break;
                    case 7:
                        chordQuality = "5b9"
                        break;
                    case 8:
                        chordQuality = "+1maj7 (no 3)/"
                        break;
                    case 9:
                        chordQuality = "6b9 (no 3)"
                        break;
                    case 10:
                        chordQuality = "7b9 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj7b9 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 2:
                switch(noteIntervals[2]) {
                    case 3:
                        chordQuality = "m2";
                        break;
                    case 4:
                        chordQuality = "add2";
                        break;
                    case 5:
                        chordQuality = "2sus4"
                        break;
                    case 6:
                        chordQuality = "+27/"
                        break;
                    case 7:
                        chordQuality = "2"
                        break;
                    case 8:
                        chordQuality = "2#5"
                        break;
                    case 9:
                        chordQuality = "6/9 (no 3)"
                        break;
                    case 10:
                        chordQuality = "9 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj9 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 3:
                switch(noteIntervals[2]) {
                    case 4:
                        chordQuality = "add#9";
                        break;
                    case 5:
                        chordQuality = "msus4"
                        break;
                    case 6:
                        chordQuality = "dim"
                        break;
                    case 7:
                        chordQuality = "m"
                        break;
                    case 8:
                        chordQuality = "+8/"
                        break;
                    case 9:
                        chordQuality = "m6"
                        break;
                    case 10:
                        chordQuality = "m7"
                        break;
                    case 11:
                        chordQuality = "m(maj7)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 4:
                switch(noteIntervals[2]) {
                    case 5:
                        chordQuality = "add4"
                        break;
                    case 6:
                        chordQuality = "majb5"
                        break;
                    case 7:
                        chordQuality = ""
                        break;
                    case 8:
                        chordQuality = "aug"
                        break;
                    case 9:
                        chordQuality = "+9m/"
                        break;
                    case 10:
                        chordQuality = "7"
                        break;
                    case 11:
                        chordQuality = "maj7"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 5:
                switch(noteIntervals[2]) {
                    case 6:
                        chordQuality = "sus4b5"
                        break;
                    case 7:
                        chordQuality = "sus4"
                        break;
                    case 8:
                        chordQuality = "+5m/"
                        break;
                    case 9:
                        chordQuality = "+5/"
                        break;
                    case 10:
                        chordQuality = "7sus4"
                        break;
                    case 11:
                        chordQuality = "maj7sus4"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 6:
                switch(noteIntervals[2]) {
                    case 7:
                        chordQuality = "5add#11"
                        break;
                    case 8:
                        chordQuality = "+87/"
                        break;
                    case 9:
                        chordQuality = "+6dim/"
                        break;
                    case 10:
                        chordQuality = "7b5 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj7b5 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 7:
                switch(noteIntervals[2]) {
                    case 8:
                        chordQuality = "+8maj7/"
                        break;
                    case 9:
                        chordQuality = "6 (no 3)"
                        break;
                    case 10:
                        chordQuality = "7 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj7 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 8:
                switch(noteIntervals[2]) {
                    case 9:
                        chordQuality = "6#5 (no 3)"
                        break;
                    case 10:
                        chordQuality = "7#5 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj7#5 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 9:
                switch(noteIntervals[2]) {
                    case 10:
                        chordQuality = "13 (no 3)"
                        break;
                    case 11:
                        chordQuality = "maj13 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            case 10:
                switch(noteIntervals[2]) {
                    case 11:
                        chordQuality = "7maj7 (no 3)"
                        break;
                    default:
                        chordQuality = "Error";
                        break;
                }
                break;
            default:
                chordQuality = "Error";
                break;
        }
        return chordQuality;
    }

    determineQuarad(noteIntervals) {
        //this method takes a 4 note chord and finds the name
        //first it finds the chord name of the 3 note chord excluding the bass note
        //then it adds the bass note back in and determines the name

        //get the upper triad
        var triadIntervals = noteIntervals.slice(1);
        var firstInterval = triadIntervals[0];

        //transpose the upper triad so that inital note is 0 rather than firstInterval
        for(var i=2; i>=0; i--){
            triadIntervals[i]-=firstInterval;
        }

        //get the triad name
        var triad = this.determineTriad(triadIntervals);

        /*

        Now each possible triad is grouped together with it's 3 inversions (by name)
        The purpose is to handle these inversions together since inversion of the upper triad do not affect the chord name

        We handle the triad group via the distance that the bass note is from the lowest note in the triad (firstInterval)
        However, this will be affected by the chord inversions
        Thus firstInterval is adjusted for each inversions so that it is the distance from the bass note to the same triad note
        Then they can be handled together

        */
        var chordQuality;
        switch(triad){
            //1
            case "7maj7 (no 3)":
                firstInterval-=1;
            case "maj7b9 (no 3)":
                firstInterval-=1;
            case "2b9":
                switch(firstInterval){
                    case 1:
                        chordQuality="m2b9";
                        break;
                    case 2:
                        chordQuality="add2#9";
                        break;
                    case 3:
                        chordQuality="add4#9";
                        break;
                    case 4:
                        chordQuality="add4b5";
                        break;
                    case 5:
                        chordQuality="sus4#11";
                        break;
                    case 6:
                        chordQuality="5#11b13";
                        break;
                    case 7:
                        chordQuality="6b13 (no 3)";
                        break;
                    case 8:
                        chordQuality="13#5 (no 3)";
                        break;
                    case 9:
                        chordQuality="13maj7 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;
                
            case "13 (no 3)":
                firstInterval-=2;
            case "maj9 (no 3)":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "mb9":
                switch(firstInterval){
                    case 1:
                        chordQuality="add2b9";
                        break;
                    case 2:
                        chordQuality="m2sus4";
                        break;
                    case 3:
                        chordQuality="m2b5";
                        break;
                    case 4:
                        chordQuality="add4";
                        break;
                    case 5:
                        chordQuality="+5m7/";
                        break;
                    case 6:
                        chordQuality="6#11 (no 3)";
                        break;
                    case 7:
                        chordQuality="7b13 (no 3)";
                        break;
                    case 8:
                        chordQuality="maj13#5 (no 3)";
                        break;
                    case 10:
                        chordQuality="7maj7b9 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "6#5 (no 3)":
                firstInterval-=3;
            case "m(maj7)":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "addb9":
                switch(firstInterval){
                    case 1:
                        chordQuality="2sus4b9";
                        break;
                    case 2:
                        chordQuality="m2b5";
                        break;
                    case 3:
                        chordQuality="add#9";
                        break;
                    case 4:
                        chordQuality="+5m(maj7)/";
                        break;
                    case 5:
                        chordQuality="+5addb9/";
                        break;
                    case 6:
                        chordQuality="7#11 (no 3)";
                        break;
                    case 7:
                        chordQuality="maj7b13 (no 3)";
                        break;
                    case 9:
                        chordQuality="13b9 (no 3)";
                        break;
                    case 10:
                        chordQuality="9maj7 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "+8maj7/":
                firstInterval-=4;
            case "maj7":
                firstInterval-=1;
            case "+1maj7/":
                firstInterval+=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
                switch(firstInterval){
                    case 2:
                        chordQuality="+2maj7/";
                        break;
                    case 3:
                        chordQuality="m2";
                        break;
                    case 4:
                        chordQuality="+4maj7/";
                        break;
                    case 5:
                        chordQuality="+5maj7/"
                        break;
                    case 6:
                        chordQuality="7sus4b5";
                        break;
                    case 7:
                        chordQuality="maj7#11 (no 3)";
                        break;
                    case 9:
                        chordQuality="+9maj7/";
                        break;
                    case 10:
                        chordQuality="+2m7/";
                        break;
                    case 11:
                        chordQuality="m7maj7";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "5add#11":
                firstInterval-=5;
            case "maj7sus4":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "b5b9":
                switch(firstInterval){
                    case 1:
                        chordQuality="2b9";
                        break;
                    case 2:
                        chordQuality="+8add#11/";
                        break;
                    case 3:
                        chordQuality="6#9";
                        break;
                    case 4:
                        chordQuality="11";
                        break;
                    case 5:
                        chordQuality="maj7sus4b5";
                        break;
                    case 7:
                        chordQuality="+8maj11/";
                        break;
                    case 8:
                        chordQuality="6/9#5 (no 3)";
                        break;
                    case 9:
                        chordQuality="m13";
                        break;
                    case 10:
                        chordQuality="7maj7";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "sus4b5":
                firstInterval-=6;
            case "maj7b5 (no 3)":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "5b9":
                switch(firstInterval){
                    case 1:
                        chordQuality="+1maj7b9 (no 3)/";
                        break;
                    case 2:
                        chordQuality="m6/9";
                        break;
                    case 3:
                        chordQuality="7#9";
                        break;
                    case 4:
                        chordQuality="maj11";
                        break;
                    case 6:
                        chordQuality="5b9#11";
                        break;
                    case 7:
                        chordQuality="2b13";
                        break;
                    case 8:
                        chordQuality="m6#5";
                        break;
                    case 9:
                        chordQuality="13";
                        break;
                    case 10:
                        chordQuality="7maj7sus4";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "add4":
                firstInterval-=7;
            case "maj7 (no 3)":
                firstInterval-=1;
            case "+1maj7 (no 3)/":
                firstInterval+=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
                switch(firstInterval){
                    case 2:
                        chordQuality="6/9b9 (no 3)";
                        break;
                    case 3:
                        chordQuality="m9";
                        break;
                    case 4:
                        chordQuality="maj7#9";
                        break;
                    case 6:
                        chordQuality="+1maj11/";
                        break;
                    case 7:
                        chordQuality="+211/";
                        break;
                    case 8:
                        chordQuality="+8maj7/";
                        break;
                    case 9:
                        chordQuality="aug6";
                        break;
                    case 10:
                        chordQuality="+5add4/";
                        break;
                    case 11:
                        chordQuality="7maj7b5 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "add#9":
                firstInterval-=8;
            case "maj7#5 (no 3)":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "6b9 (no 3)":
                switch(firstInterval){
                    case 1:
                        chordQuality="9addb9 (no 3)";
                        break;
                    case 2:
                        chordQuality="m(maj9)";
                        break;
                    case 4:
                        chordQuality="+1maj7#9/";
                        break;
                    case 5:
                        chordQuality="+27#9/";
                        break;
                    case 6:
                        chordQuality="m#11";
                        break;
                    case 7:
                        chordQuality="addb13";
                        break;
                    case 8:
                        chordQuality="+5add#9/";
                        break;
                    case 9:
                        chordQuality="13b5 (no 3)";
                        break;
                    case 10:
                        chordQuality="7maj7 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;
            
            case "m2":
                firstInterval-=9;
            case "maj13 (no 3)":
                firstInterval-=1;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "7b9 (no 3)":
                switch(firstInterval){
                    case 1:
                        chordQuality="maj9b9";
                        break;
                    case 3:
                        chordQuality="addb9#9";
                        break;
                    case 4:
                        chordQuality="add2add4";
                        break;
                    case 5:
                        chordQuality="+57b9 (no 3)/";
                        break;
                    case 6:
                        chordQuality="add#11";
                        break;
                    case 7:
                        chordQuality="sus4b13";
                        break;
                    case 8:
                        chordQuality="+87b9 (no 3)/";
                        break;
                    case 9:
                        chordQuality="13 (no 3)";
                        break;
                    case 10:
                        chordQuality="7maj7#5 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            //2
            case "7#5 (no 3)":
                firstInterval-=2;
            case "9 (no 3)":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "add2":
                switch(firstInterval) {
                    case 1:
                        chordQuality="+1maj9/";
                        break;
                    case 2:
                        chordQuality="+29/";
                        break;
                    case 3:
                        chordQuality="msus4";
                        break;
                    case 4:
                        chordQuality="+87#5/";
                        break;
                    case 5:
                        chordQuality="+5add2/";
                        break;
                    case 6:
                        chordQuality="+89/";
                        break;
                    case 7:
                        chordQuality="maj13 (no 3)";
                        break;
                    case 9:
                        chordQuality="maj13b9 (no 3)";
                        break;
                    case 11:
                        chordQuality="m(maj7)b9";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "6 (no 3)":
                firstInterval-=3;
            case "m7":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "2sus4":
                switch(firstInterval){
                    case 1:
                        chordQuality="dimb9";
                        break;
                    case 2:
                        chordQuality="add2";
                        break;
                    case 3:
                        chordQuality="+5m7/";
                        break;
                    case 4:
                        chordQuality="+9m6/";
                        break;
                    case 5:
                        chordQuality="7sus4";
                        break;
                    case 6:
                        chordQuality="+87#9/";
                        break;
                    case 8:
                        chordQuality="+10m9/";
                        break;
                    case 9:
                        chordQuality="maj13 (no 3)";
                        break;
                    case 11:
                        chordQuality="maj7b9";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "+87/":
                firstInterval-=4;
            case "7":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "+27/":
                switch(firstInterval){
                    case 1:
                        chordQuality="mb9";
                        break;
                    case 2:
                        chordQuality="+47#5/";
                        break;
                    case 3:
                        chordQuality="+57";
                        break;
                    case 4:
                        chordQuality="7b5";
                        break;
                    case 5:
                        chordQuality="maj7sus4";
                        break;
                    case 7:
                        chordQuality="+97#9/";
                        break;
                    case 8:
                        chordQuality="+109/";
                        break;
                    case 9:
                        chordQuality="m6(maj7)";
                        break;
                    case 11:
                        chordQuality="+17maj7/";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "sus4":
                firstInterval-=5;
            case "7sus4":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "2":
                switch(firstInterval){
                    case 1:
                        chordQuality="+1maj9 (no 3)/";
                        break;
                    case 2:
                        chordQuality="+29 (no 3)/";
                        break;
                    case 3:
                        chordQuality="m11";
                        break;
                    case 4:
                        chordQuality="maj7b5";
                        break;
                    case 6:
                        chordQuality="+811/";
                        break;
                    case 7:
                        chordQuality="6/9 (no 3)";
                        break;
                    case 8:
                        chordQuality="+8add2/";
                        break;
                    case 9:
                        chordQuality="maj13";
                        break;
                    case 11:
                        chordQuality="+112b9/";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "majb5":
                firstInterval-=6;
            case "7b5 (no 3)":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "2#5":
                switch(firstInterval){
                    case 1:
                        chordQuality="m6b9";
                        break;
                    case 2:
                        chordQuality="9";
                        break;
                    case 3:
                        chordQuality="msus4(maj7)";
                        break;
                    case 5:
                        chordQuality="sus4b9";
                        break;
                    case 6:
                        chordQuality="+87b5/";
                        break;
                    case 7:
                        chordQuality="m6";
                        break;
                    case 8:
                        chordQuality="7#5";
                        break;
                    case 9:
                        chordQuality="maj13sus4";
                        break;
                    case 11:
                        chordQuality="maj7b9 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "msus4":
                firstInterval-=7;
            case  "7 (no 3)":
                firstInterval-=2;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "6/9 (no 3)":
                switch(firstInterval){
                    case 1:
                        chordQuality="m7b9";
                        break;
                    case 2:
                        chordQuality="maj9";
                        break;
                    case 4:
                        chordQuality="b5b9";
                        break;
                    case 5:
                        chordQuality="2sus4";
                        break;
                    case 6:
                        chordQuality="+87/";
                        break;
                    case 7:
                        chordQuality="6";
                        break;
                    case 8:
                        chordQuality="+86/9/";
                        break;
                    case 9:
                        chordQuality="+9m6/9/";
                        break;
                    case 11:
                        chordQuality="maj7#5b9 (no 3)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            //3
            case "+6dim/":
                firstInterval-=3;
            case "m6":
                firstInterval-=3;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "dim":
                switch(firstInterval){
                    case 1:
                        chordQuality="b9";
                        break;
                    case 2:
                        chordQuality="+2m7b5/";
                        break;
                    case 3:
                        chordQuality="dim7";
                        break;
                    case 4:
                        chordQuality="7";
                        break;
                    case 5:
                        chordQuality="maj7sus4b5";
                        break;
                    case 7:
                        chordQuality="7b9 (no 3)";
                        break;
                    case 8:
                        chordQuality="maj9#5 (no 3)";
                        break;
                    case 10:
                        chordQuality="7b9";
                        break;
                    case 11:
                        chordQuality="maj9sus4";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "+5m/":
                firstInterval-=4;
            case "+9m/":
                firstInterval-=3;
                if(firstInterval<0) {
                    firstInterval+=12;
                }
            case "m":
                switch(firstInterval){
                    case 1:
                        chordQuality="+1m(maj7)/";
                        break;
                    case 2:
                        chordQuality="+2m7/";
                        break;
                    case 3:
                        chordQuality="m7b5";
                        break;
                    case 4:
                        chordQuality="maj7";
                        break;
                    case 6:
                        chordQuality="+6m#11/";
                        break;
                    case 7:
                        chordQuality="9 (no 3)";
                        break;
                    case 8:
                        chordQuality="m(maj7)#5";
                        break;
                    case 10:
                        chordQuality="+1maj13/";
                        break;
                    case 11:
                        chordQuality="+213/";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            case "":
                firstInterval-=5;
            case "+5/":
                firstInterval-=3;
            case "+8/":
                firstInterval+=8;
                firstInterval%=12;
                chordQuality="+"+firstInterval+"/";
                switch(firstInterval){
                    case 1:
                        chordQuality="+1maj7/";
                        break;
                    case 2:
                        chordQuality="+27/";
                        break;
                    case 3:
                        chordQuality="m7";
                        break;
                    case 4:
                        chordQuality="maj7#5";
                        break;
                    case 6:
                        chordQuality="+6add#11/";
                        break;
                    case 7:
                        chordQuality="maj9 (no 3)";
                        break;
                    case 9:
                        chordQuality="6b9";
                        break;
                    case 10:
                        chordQuality="m11 (no 3)";
                        break;
                    case 11:
                        chordQuality="dim(maj7)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;
                
            //4
            case "aug":
                switch(firstInterval){
                    case 1:
                        chordQuality="+1maj7#5/";
                        break;
                    case 2:
                        chordQuality="9b5 (no 3)";
                        break;
                    case 3:
                        chordQuality="m(maj7)";
                        break;
                    case 5:
                        chordQuality="+5addb13/";
                        break;
                    case 6:
                        chordQuality="9b5 (no 3)";
                        break;
                    case 7:
                        chordQuality="m(maj7)";
                        break;
                    case 9:
                        chordQuality="6sus4b9";
                        break;
                    case 10:
                        chordQuality="+27#5/";
                        break;
                    case 11:
                        chordQuality="m(maj7)";
                        break;
                    default:
                        chordQuality="Error";
                        break;
                }
                break;

            default:
                chordQuality = "Error";
        }
        return chordQuality;
    }


    determineName(bassTone, quality) {

        //if this is a slash chord
        if(quality[quality.length-1]==="/") {

            //name is chordname/basstone. (quality is the chordname/ because of the resolve inversion function)
            return quality + bassTone;
        }

        //otherwise we use the root and quality to construct the chord name
        return bassTone + quality;
    }
}

export default Chord;