import React from "react";

function FileInput({setAudio}){


    let reader = new FileReader();

    reader.addEventListener(
        
        "load", () => {setAudio(reader.result)
            console.log("loaded")
            console.log(reader.result)
        }
    );
    function handleFile(event){
        let file = event.target.files[0];
        if(file){
            reader.readAsArrayBuffer(file);
        }
    }



    return(
        <div>
            <input type = "file" onChange = {handleFile}/>
        </div>
    );

} export default FileInput