# Grading Framework

Simple grid-based grading framework for grading students' work. Original idea and design by [gedoensmanagement](https://github.com/gedoensmanagement).

## How to use it 
### Start a session
1. Run `python3 -m http.server` in the root directory of the project
2. Open `localhost:8000` in your browser
3. (Load previous progress with the load button)

### Save your work
Since Firefox does not support the File System Access API, for now the save button just triggers a download of a json file with all the input values. 
You can then reload that file with the load button. 
