This project was created to take an audio file as input and output the chords detected in the music.

It does so by analyzing the frequencies using FFTs in order to determine which notes are being played as the audio file is played.
The "harmonic adjustments" flag is recommended and is used to reduce the amplitude of each frequency in a note's harmonic series, once the note has been determined to be in the chord.
This minimizes erroneous notes being added due to the harmonic overtone series.

Then, a modulus operation is performed on the notes so that the chord quality can be determined, independent of the root note.
All four or fewer note chord combinations (more than 2 million) are able to be named by doing this.

The code is thoroughly commented.
