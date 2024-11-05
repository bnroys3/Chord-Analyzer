
import { guess } from 'web-audio-beat-detector';
import Note from './Note';
import Chord from './Chord';
import React, { useEffect, useRef, useState } from 'react';

function PitchDetector({setChordName, setFrequencies, audio}){

    let audioContext;
    let analyser;
    let bufferSource;
    const beatLengthRef = useRef(null);
    const frequencyDataRef = useRef(null);
    const beatOffsetRef = useRef(0);
    const audioRef = useRef(null);
    const startTimeRef = useRef(0);
    const beatIndexRef = useRef(null);
    let frequencyIndexMap;
    const frequencyPeaksRef = useRef([]);
    const frequencyPeakMagnitudesRef = useRef([]);
    const peakThreshold = 120; //is there a way to calculate this?
    const noteThresholdRef = useRef(0);
    const chordsRef = useRef(null);
    const statusRef = useRef(0); //status 0 - waiting. 1 - playing. 2 - paused.
    const pauseIndexRef = useRef(0);
    const minFrequency = 60;
    const [bpm, setBpm] = useState(null);
    const [isAdjustHarmonics, setIsAdjustHarmonics] = useState(true);
    const codedAudioRef = useRef(null);
    const decoded = useRef(false);

    useEffect(() => {
        if(audio){
            codedAudioRef.current = audio;
            decoded.current = false;
        }
    }, [audio])
   


    function stop(){
        
        //don't do anything if already stopped
        if(statusRef.current===0){
            return;
        }
        //set the current beat to the end so that the song will no longer process
        beatIndexRef.current = audioRef.current.duration/beatLengthRef.current;


        //if its not in process manually call endAnalysis()
        //if it was playing this will happen from the current buffersource ending
        if(statusRef.current===2){
            endAnalysis();
        }

    }

    function pause(){

        //don't do anything unless playing
        if(statusRef.current!==1){
            return;
        }

        
        //save the current beat in case of resume, with a bit of rewind
        pauseIndexRef.current = beatIndexRef.current-2;
        if(pauseIndexRef.current < 0) {
            pauseIndexRef.current = 0;
        }

        //set the current beat to the end so that the song will no longer process
        beatIndexRef.current = audioRef.current.duration/beatLengthRef.current;
        statusRef.current = 2;
        console.log("paused on beat " + pauseIndexRef.current);
    }

    async function start(){

        //don't do anything if it's already started
        if(statusRef.current===1){ 
            return;
        }

        //init audio context if necessary
        if(!audioContext){
            initAudioContext();
        }


        if(statusRef.current===0) {
        //load the audio data
            decodeAndStartAudioData();

            
        } else {
            beatIndexRef.current = pauseIndexRef.current;
            statusRef.current = 1;
            analyzeNextBeat();
        }
            
    }

    async function decodeAndStartAudioData(){
        console.log("Audio Ref:")
        console.log(audioRef.current)
        console.log("Coded Ref:")
        console.log(codedAudioRef.current)
        if(!decoded.current){
            audioContext.decodeAudioData(codedAudioRef.current)
                .then(decodedAudio => {
                    audioRef.current = decodedAudio;
                    decoded.current = true;
                    //use the web-audio-beat-detector library to get the offset and tempo
                    return guess(decodedAudio)
                })
                .then(({offset, tempo}) => {
                    setBpm(tempo);
                    
                    beatLengthRef.current = 60/tempo;
                    beatOffsetRef.current = offset + beatLengthRef.current/4;

                    startAnalysis();
                })
                .catch(error => console.log(error));
        } else {

            startAnalysis();

        }
    }

    function startAnalysis() {
        beatIndexRef.current = 0;
        frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
        frequencyPeaksRef.current = [];
        frequencyPeakMagnitudesRef.current = [];
        chordsRef.current = [];

        statusRef.current = 1;
        analyzeNextBeat();
    }
    function initAudioContext(){
        audioContext = new AudioContext();
        analyser = new AnalyserNode(audioContext);
        analyser.fftSize = 8192*2;
        frequencyIndexMap = new Array(analyser.frequencyBinCount);
        fillFrequencyIndexMap();
    }

    function fillFrequencyIndexMap(){
        //frequencyIndexMap is filled to be used to find frequencies corresponding to each index of the fft
        const maxFrequency = audioContext.sampleRate/2;
        const stepHz = maxFrequency/(frequencyIndexMap.length-1);
        for(let i = 0; i < frequencyIndexMap.length; i++) {
            frequencyIndexMap[i] = i*stepHz;
        }
    }

    function newBufferSource(){

        bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = audioRef.current;
        bufferSource.connect(analyser);

        //sound output
        bufferSource.connect(audioContext.destination);

        bufferSource.onended = () => {

            //update the startTime for the next beat segment
            startTimeRef.current = beatOffsetRef.current + beatIndexRef.current*beatLengthRef.current;

            //determine whether there is more audio remaining
            if(startTimeRef.current < audioRef.current.duration){
                analyzeNextBeat();

            } else if(statusRef.current!==2) {
                endAnalysis();
            }
        }
    }

    function endAnalysis(){
        console.log("finished.");
        statusRef.current = 0;
        setChordName("");
        console.log(chordsRef.current);
    }

    function analyzeNextBeat(){
        console.log("Analyzing beat " + beatIndexRef.current);

        //create a new buffer source to play the next segment
        newBufferSource();
        bufferSource.start(0, startTimeRef.current, beatLengthRef.current);

        //if this beat hasn't been analyzed yet (in case of pause/resume or rewind)
        if(!chordsRef.current[beatIndexRef.current]){

            //get the note frequencies
            analyser.getByteFrequencyData(frequencyDataRef.current);
            findFrequencyPeaks();
            setFrequencies(frequencyDataRef.current);
            //use the frequencies to find the notes, and those to find the chord
            let notes = calculateNotes();
            let chord = new Chord(notes);
            chordsRef.current.push(chord.name);
            console.log(chord.name);
        }

        //update chordName and iterate beat
        setChordName(chordsRef.current[beatIndexRef.current]);
        
        console.log("finished analyzing beat " + beatIndexRef.current);
        beatIndexRef.current++;
    }

    function findFrequencyPeaks(){

        frequencyPeaksRef.current.push([]);
        frequencyPeakMagnitudesRef.current.push([]);
        let peakDbSum = 0;
        let numberOfPeaks = 0;
        
        //don't look at indexes without precision to determine notes
        let i = Math.floor(minFrequency/frequencyIndexMap[1]);

        //iterate through frequencies
        for(i; i < frequencyDataRef.current.length-1; i++) {
            
            //where increasing
            if(frequencyDataRef.current[i] >= frequencyDataRef.current[i+1]) {

                //where above threshold for peak and a maximum
                if(frequencyDataRef.current[i] >= peakThreshold && frequencyDataRef.current[i] >= frequencyDataRef.current[i-1]){
                    
                    //add new frequency peak [magnitude, frequency]
                    peakDbSum += frequencyDataRef.current[i];
                    numberOfPeaks++;
                    frequencyPeaksRef.current[beatIndexRef.current].push(frequencyIndexMap[i]);


                    frequencyPeakMagnitudesRef.current[beatIndexRef.current].push(frequencyDataRef.current[i]);

                    //reduce the magnitudes of all harmonic frequencies.
                    if(isAdjustHarmonics){
                        let j = 2;
                        let harmonicFrequency = j*frequencyIndexMap[i];
                        let adjustmentAmount = 50;
                        while(harmonicFrequency < frequencyIndexMap[frequencyIndexMap.length-1] && adjustmentAmount > 10){
                            let lowerIndex = Math.floor(harmonicFrequency/frequencyIndexMap[1]);
                            let upperIndex = Math.floor(1.06*harmonicFrequency/frequencyIndexMap[1]);//1.06 times the frequency is the next semitone

                            //adjust the frequency magnitudes of those in range of harmonic multiple
                            //if they are above the beat (note unsigned)
                            for(let k = lowerIndex; k < upperIndex; k++){
                                if(frequencyDataRef.current[k]>peakThreshold){
                                    frequencyDataRef.current[k]-=adjustmentAmount;                            
                                }
                            }
                            
                            j++;
                            //harmonic frequencies are multiples of fundamental frequency
                            harmonicFrequency = j*frequencyIndexMap[i];

                            //update the adjustment amount based on harmonic series (1/j)
                            adjustmentAmount = 30;
                        }
                    }

                }

                //if freq[i] >= freq[i+1] then the next freq cannot be a max.
                i++;
            }
        }

        //note threshold is updated based on the current average peak height
        //meaning just because the magnitude threshold is met, the peak is not necessarily a note

        noteThresholdRef.current = peakDbSum/(numberOfPeaks)*1.1; // calculation of note threshold                      adjust as needed to fine-tune
        console.log("The current threshold is "  + Math.max(noteThresholdRef.current, peakThreshold));
    }

    function calculateNotes(){
        let notes = [];
        
        // iterate through the frequency peaks found within the beat
        for(let i = 0; i < frequencyPeaksRef.current[beatIndexRef.current].length; i++){

            let frequency = frequencyPeaksRef.current[beatIndexRef.current][i];

            
            //skip over any peak frequencies that do not meet current the magnitude requirements
            //(based on average peak magnitude)
            if(frequencyPeakMagnitudesRef.current[beatIndexRef.current][i]<noteThresholdRef.current){
                //console.log("peak mag avg would skip the following note");
                if(notes.length === 0){
                    console.log("bass note saved");
                } else{
                    continue;
                }
            }

            /*
            //skip any that were not part of the last beat.
            //Frequencies only part of one beat will not be considered part of the chord.
            if(frequencyPeaksRef.current[beatIndexRef.current-1].indexOf(frequency)===-1){
                continue;
            }

            //skip over any where the last beat did not meet the the magnitude requirements
            //(based on average peak magnitude)
            if(frequencyPeakMagnitudesRef.current[beatIndexRef.current][i-1]<noteThresholdRef.current){
                console.log("peak skipped");
                continue;
            }
            */



            //calculate octave using the the fact each octave has frequencies related by powers of 2
            let octave = -1;
            let nextOctaveThreshold = 0; 
            while(frequency > nextOctaveThreshold){
                octave++;
                nextOctaveThreshold = 2**(octave+1)*16.35*.97;
            }
            let frequencyInOctave0 = frequency/2**(octave);

            //determine the tone by scaling the frequency into octave 0
            //and comparing it against frequency thresholds
            let tone;
            if(frequencyInOctave0 < 16.835) {
                tone = "C";
            } else if(frequencyInOctave0 < 17.835) {
                tone = "C#";
            } else if(frequencyInOctave0 < 18.9) {
                tone = "D";
            } else if(frequencyInOctave0 < 20.025) {
                tone = "D#";
            } else if(frequencyInOctave0 < 21.215) {
                tone = "E";
            } else if(frequencyInOctave0 < 22.475) {
                tone = "F";
            } else if(frequencyInOctave0 < 23.81) {
                tone = "F#";
            } else if(frequencyInOctave0 < 25.23) {
                tone = "G";
            } else if(frequencyInOctave0 < 26.73) {
                tone = "G#";
            } else if(frequencyInOctave0 < 28.83) {
                tone = "A";
            } else if(frequencyInOctave0 < 30.005) {
                tone = "A#";
            } else {
                tone = "B";
            }
            notes.push(new Note(tone+octave));

            


            console.log("note: "+tone+octave);
            console.log("magnitude: "+frequencyPeakMagnitudesRef.current[beatIndexRef.current][i]);
        }
        return notes;
    }

    function toggleHarmonics(){
        setIsAdjustHarmonics(!isAdjustHarmonics);
    }


    return(
        <div>
            <div>BPM: {Math.floor(bpm*100+.5)/100}</div>
            <span>
                <button className = 'main-button' onClick = {start}>Start</button>
                <button className = 'main-button' onClick = {pause}>Pause</button>
                <button className = 'main-button' onClick = {stop}>Stop</button>
            </span>
            <div>Harmonics adjustment: <button onClick = {toggleHarmonics}>{isAdjustHarmonics ? "On" : "Off"}</button></div>
        </div>
    );

}

export default PitchDetector;