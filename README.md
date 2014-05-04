CS130E-S14-Labs
===============

Bouncysound
-----------

Silly little game. Light on the actual web audio wizardry, but there's a heck 
of a lot of interesting theory work in here in terms of grappling with the 
western system of scales and notes and piano nonsense.

Play with either the arrow keys and mouse, or tilting your device around and 
using its touchscreen. Try touching the main area with multiple fingers, and 
also dragging around the notes on the bottom.

All the useful stuff is exposed to the user through some interface except for 
the key-changing function-- pop open the console and set the variable called 
`key` to an integer representing a key in music, 0 being A Natural, and each 
proceeding integer representing the next half-step up. Also the `flatkey` 
variable, set it to `true` if you want the notes to be represented with their 
enharmonic equivilants with flats in them instead of sharps.
