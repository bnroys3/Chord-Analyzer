class Note {

    //accepts note names in "A0", "Bb3", "A#3"... format
    constructor(name) {
        this.name = name;
        
        //capture the first 1 or 2 of the 3 characters as the tone (to include # or b)
        this.tone = name.toString().substring(0,name.length-1);

        //capture the last character as the octave
        this.octave = Number(name[name.length-1]);

        //assign note numerical index for any calculations
        this.chromaticIndex = Note.calculateChromaticIndex(this);
    }

    //assigns a number to each note, 0 being A0 and 87 being C8 (based on piano)
    static calculateChromaticIndex(note) {
    
        //12 notes per octave, shift by 9 because only A0, A#0, B0 in ocatve 0
        var octaveOffset = note.octave*12-9;
        var toneIndex;

        //assign an index to each note chromatically
        switch(note.tone) {
            case 'C':
                toneIndex=0;
                break;
            case 'C#':
            case 'Db':
                toneIndex=1;
                break;
            case 'D':
                toneIndex=2;
                break;
            case 'D#':
            case 'Eb':
                toneIndex=3;
                break;
            case 'E':
                toneIndex=4;
                break;
            case 'F':
                toneIndex=5;
                break;
            case 'F#':
            case 'Gb':
                toneIndex=6;
                break;
            case 'G':
                toneIndex=7;
                break;
            case 'G#':
            case 'Ab':
                toneIndex=8;
                break;
            case 'A':
                toneIndex=9;
                break;
            case 'A#':
            case 'Bb':
                toneIndex=10;
                break;
            case 'B':
                toneIndex=11;
                break;
            default:
                toneIndex=0;
                break;
        }
        
        //the resulting sum will be the chromatic index
        return octaveOffset+toneIndex;
    }
}

export default Note;