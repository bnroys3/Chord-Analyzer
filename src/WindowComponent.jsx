import React, { useEffect, useState } from 'react';
import PitchDetector from './PitchDetector';
import './styles.css';
import FileInput from './FileInput';


function WindowComponent() {

    const [chordName, setChordName] = useState("");
    const [audio, setAudio] = useState("");
    const [frequencies, setFrequencies] = useState(null)

   

    return(
        <div className='container'>
            <div>
                <h1></h1>
            </div>
            <FileInput setAudio={setAudio}/>
            <div>
                <PitchDetector setChordName={setChordName} setFrequencies={setFrequencies} audio={audio} />
            </div>
            <br></br>
            <div>
                <span className = 'chord-label'>{chordName}</span>
                {!chordName && <br></br>}
            </div>
    
        </div>
    );

}

export default WindowComponent;