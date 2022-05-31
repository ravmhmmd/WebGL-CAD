// import all variable functions from the utils.js file
import {
    loadtoF,
} from "./utils.js";

// Define the canvas and the rendering context
var canvas;
var gl;
const maxNumVertices = 20000;

// Define the coordinates of the points
var x = 0, y = 0;

// Define the colors
var color = [0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]; // black is default

// Define variables for the points and colors

// Line
var lineC = [];
var lineP = [];

// Square
var SQC = [];
var SQP = [];
var arrSQP = [];
var arrSQC = [];

// Polygon
var polyP = [];
var polyC = [];
var arrNumpoly = [];
var arrpolyP = [];
var arrpolyC = [];

// Variables to count points of polygon
var numpolyDone = 0;

// Rectangle
var rectC = [];
var rectP = [];
var arrrectC = [];
var arrrectP = [];

var mouseClicked;

// Variables to set movement of the points
var isMoveX = false;
var isMoveY = false;
let movePdet = !true;

// Width of the line, square, rectangle, and polygon
var width = 0.5;

// Temporary variables
let tempMv = [];
let tempIdx = [];
let moved;

// Get A WebGL context
canvas = document.getElementById("canvas");
gl = canvas.getContext("webgl");

var bufferId = gl.createBuffer();
var cBufferId = gl.createBuffer();

window.onload = function init() {

    // If we don't have a GL context, give up now
    if (!gl) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        gl = null;
    }
    else {

        // Resize canvas
        canvas.width = 63 / 64 * window.innerWidth;
        canvas.height = 26 / 32 * window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Initialize the shape to be a line, just like the default radio button choice
    var shapeName = "Line";

    // Add an event listener to the shape radio buttons
    document.getElementById("shape").addEventListener("click", function (e) {
        shapeName = e.target.value;
    });

    // Initialize the mode to create, just like the default radio button choice
    var modeName = "Create";

    // Add an event listener to the mode radio buttons
    document.getElementById("mode").addEventListener("click", function (e) {
        modeName = e.target.value;
        switch (modeName) {
            case "moveX":
                isMoveX = true;
                isMoveY = false;
                break;
            case "moveY":
                isMoveX = false;
                isMoveY = true;
                break;
            case "moveXY":
                isMoveX = true;
                isMoveY = true;
            default:
                break;
        }
    });

    // Add an event listener to the width input
    document.getElementById("width").addEventListener("change", function (e) {
        width = e.target.value;
    });

    // Add an event listener to the color radio buttons
    document.getElementById("color").addEventListener("change", function (e) {
        var hex = e.target.value;
        const [_, rgb] = hex.split("#");
        const red = parseInt(rgb.slice(0, 2), 16);
        const green = parseInt(rgb.slice(2, 4), 16);
        const blue = parseInt(rgb.slice(4, 6), 16);
        const alpha = 1;
        color = [];
        for (let _ in [1, 2]) {
            for (let col of [red, green, blue]) {
                color.push(col / 255);
            }
            color.push(alpha);
        }
    });

    // Add an event listener to the save button
    document.getElementById("save").addEventListener("click",
        function () {
            const data = {
                lineP,
                lineC,
                SQC,
                SQP,
                rectC,
                rectP,
                arrSQC,
                arrSQP,
                arrpolyP,
                arrpolyC,
                arrrectC,
                arrrectP,
                arrNumpoly,
            };
            loadtoF(JSON.stringify(data));
        }
    );

    // Add an event listener to the load button
    document.getElementById("load").addEventListener("change", 
        function (e) {
            const file = e.target.files[0];
            var reader = new FileReader();
            reader.addEventListener("load", function (e) {
                let data = e.target.result;
                data = JSON.parse(data);
                lineC = data.lineC;
                lineP = data.lineP;
                SQC = data.SQC;
                SQP = data.SQP;
                arrSQC = data.arrSQC;
                arrSQP = data.arrSQP;
                rectC = data.rectC;
                rectP = data.rectP;
                arrrectC = data.arrrectC;
                arrrectP = data.arrrectP;
                arrpolyP = data.arrpolyP;
                arrpolyC = data.arrpolyC;
                arrNumpoly = data.arrNumpoly;
                render();
            });
            reader.readAsBinaryString(file);
        }
    );

    // Add an event listener to the clear button
    document.getElementById("clear").addEventListener("click",
        function () {

            // Clear the canvas
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Reset the line points and colors
            lineP = [];
            lineC = [];

            // Reset the SQ points and colors
            SQP = [];
            SQC = [];

            // Reset the poly points and colors
            polyP = [];
            polyC = [];

            // Reset the rect points and colors
            rectP = [];
            rectC = [];

            // Reset the array of SQ points and colors
            arrSQP = [];
            arrSQC = [];

            // Reset the array of poly points and colors
            arrpolyP = [];
            arrpolyC = [];

            // Reset the array of poly number
            arrNumpoly = [];

            // Reset the array of rect points and colors
            arrrectP = [];
            arrrectC = [];

            // Reset the array of line points and colors
            arrrectP = [];
            arrrectC = [];
        }
    );

    const getPost = (event) => {
        x = (2 * event.clientX) / canvas.width - 1.01;
        y = (2 * (canvas.height - event.clientY)) / canvas.height - 0.7;
    };

    const getIdx = (index) => {
        if (index === 0) return "L";
        if (index === 1) return "S";
        if (index === 2) return "P";
        return "";
    };

    const isCoorChosen = (oneX, oneY, x, y) => {
        const difX = Math.abs(oneX - x);
        const difY = Math.abs(oneY - y);
        return difX + difY < 0.1;
    };

    const checkPexist = (x = x, y = y) => {
        let temp = [lineP, SQP, rectP];
        for (let index in temp) {
            for (let i = 0; i < temp[index].length; i += 2) {
                const oneX = temp[index][i];
                const oneY = temp[index][i + 1];
                if (isCoorChosen(oneX, oneY, x, y)) {
                    movePdet = true;
                    tempMv = [x, y];
                    tempIdx = [i, i + 1, getIdx(parseInt
                        (index))];
                }
            }
        }
        for (let index in arrpolyP) {
            for (let i = 0; i < arrpolyP[index].length; i += 2) {
                const oneX = arrpolyP[index][i];
                const oneY = arrpolyP[index][i + 1];
                if (isCoorChosen(oneX, oneY, x, y)) {
                    movePdet = true;
                    tempMv = [x, y];
                    tempIdx = [i, i + 1, "P", index];
                }
            }
        }
    };

    // This is a callback function that gets called every time the mouse moves
    canvas.addEventListener("mousedown", (event) => {
        if (isMoveX || isMoveY) {
            moved = false;
            getPost(event);
            checkPexist(x, y);
        }
    });
    canvas.addEventListener("mousemove", () => {
        if (isMoveX || isMoveY) {
            moved = true;
        }
    });
    canvas.addEventListener("mouseup", (event) => {
        if ((isMoveX || isMoveY) && moved && movePdet) {
            getPost(event);
            let array;
            if (tempIdx[2] === "L") array = lineP;
            if (tempIdx[2] === "S") array = SQP;
            if (tempIdx[2] === "R") array = rectP;
            if (tempIdx[2] === "P") array = arrpolyP[tempIdx[3]];
            if (isMoveX) array[tempIdx[0]] = x;
            if (isMoveY) array[tempIdx[1]] = y;
            render();
        }
    });

    canvas.addEventListener("click", 
        function (event) 
        {
            switch (modeName) 
            {
                case "Create":
                    if (!isMoveX && !isMoveY) 
                    {
                        switch (shapeName) 
                        {
                            case "Line":
                                if (!mouseClicked) 
                                {
                                    getPost(event);
                                    mouseClicked = true;
                                } else 
                                {
                                    lineP.push(x);
                                    lineP.push(y);
                                    getPost(event);
                                    lineP.push(x);
                                    lineP.push(y);
                                    lineC.push(color);
                                    mouseClicked = false;
                                    render();
                                }
                                break;
                            
                            case "Square":
                                mouseClicked = false;
                                getPost(event);

                                SQP.push(x + (0.4 * width));
                                SQP.push(y);

                                SQP.push(x);
                                SQP.push(y);

                                SQP.push(x + (0.4 * width));
                                SQP.push(y - width);

                                SQP.push(x);
                                SQP.push(y - width);

                                SQC.push(color);
                                SQC.push(color);

                                arrSQP.push(SQP);
                                arrSQC.push(SQC);

                                render();
                                break;
                            case "Rectangle":
                                mouseClicked = false;
                                getPost(event);

                                rectP.push(x + width);
                                rectP.push(y);

                                rectP.push(x);
                                rectP.push(y);

                                rectP.push(x + width);
                                rectP.push(y - width);

                                rectP.push(x);
                                rectP.push(y - width);

                                rectC.push(color);
                                rectC.push(color);

                                arrrectP.push(rectP);
                                arrrectC.push(rectC);

                                render();
                                break;
                            case "Polygon":
                                var numpoly = parseFloat(
                                    document.getElementById("nodepoly").value
                                );
                                mouseClicked = false;

                                if (numpolyDone < numpoly - 1) {
                                    getPost(event);
                                    polyP.push(x);
                                    polyP.push(y);
                                    polyC.push(color);
                                    polyC.push(color);
                                    numpolyDone++;
                                } else {
                                    numpoly = parseFloat(document.getElementById("nodepoly").value);
                                    getPost(event);
                                    polyP.push(x);
                                    polyP.push(y);
                                    polyC.push(color);
                                    polyC.push(color);
                                    arrpolyP.push(polyP);
                                    arrpolyC.push(polyC);
                                    arrNumpoly.push(numpoly);
                                    polyP = [];
                                    polyC = [];
                                    render();
                                    numpolyDone = 0;
                                }
                            default:
                                break;
                        }
                    }
                    break;
                case "UpdateColor":
                    switch (shapeName) {
                        case "Square":
                            getPost(event);
                            getSQAtPosition(x, y);
                            break;
                        case "Rectangle":
                            getPost(event);
                            getRectAtPosition(x, y);
                        case "Polygon":
                            getPost(event);
                            getPolyAtPosition(x, y);
                        default:
                            break;
                    }
                default:
                    break;
            }
        }
    );
    // Konfigurasi  WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //  Load shaders and initialize attribute buffers
    var vertElm = document.getElementById("vertex-shader").innerText;
    var fragElm = document.getElementById("fragment-shader").innerText;

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, vertElm);
    gl.shaderSource(fragmentShader, fragElm);

    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        gl.useProgram(program);
    }
    else {
        alert("Could not initialize shaders");
        // Error message
        console.log(gl.getProgramInfoLog(program));
    }

    //Load Data ke GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);
    var vPos = gl.getAttribLocation(program, "v_post");
    gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPos);

    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);
    var v_color = gl.getAttribLocation(program, "v_color");
    gl.vertexAttribPointer(v_color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(v_color);
};

function flatten(v) {
    // This is a helper function to flatten a 2D array into a 1D array
    // Used for converting the array of points into a 1D array for WebGL
    if (v.matrix === true) {
        v = transpose(v);
    }

    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }
    return floats;
}

function getSQAtPosition(currX, currY) {
    var n = 8
    var j = 0
    for (var i = SQP.length; i > -1; i -= n) {
        if (currX >= SQP[i - 6] && currX <= SQP[i - 8] && currY >= SQP[i - 3] && currY <= SQP[i - 5]) {
            var idx = SQP.length - (2 * n * j);
            SQC.splice(idx, 16, color, color);
            render();
            return;
        }
        j++;
    }
}

function getRectAtPosition(currX, currY) {
    var n = 8
    var j = 0
    for (var i = rectP.length; i > -1; i -= n) {
        if (currX >= rectP[i - 6] && currX <= rectP[i - 8] && currY >= rectP[i - 3] && currY <= rectP[i - 5]) {
            var idx = rectP.length - (2 * n * j);
            rectC.splice(idx, 48, color, color);
            render();
            return;
        }
        j++;
    }
}

function getPolyAtPosition(currX, currY) {
    var n = 6
    var j = 0
    for (var i = arrpolyP.length; i > 0; i -= n) {
        if (isInsidepoly(currX, currY, arrpolyP.slice(i - 6, i)) == true) {
            var idx = 48 * j;
            var currColor = getCurrColorpoly(color)
            arrpolyC.splice(idx, 48, currColor);
            render();
            return;
        }
        j++;
    }
}

function getCurrColorpoly(color) {
    var newColor = [];
    for (var i = 0; i < 6; i++) {
        newColor = newColor.concat(color)
    }
    return newColor;
}

function isInsidepoly(currX, currY, arr) {
    var inside = false;
    for (var i = 0, j = arr.length - 2; i < arr.length; i += 2) {
        var x1 = arr[i], y1 = arr[i + 1]
        var x2 = arr[j], y2 = arr[j + 1]
        j = i;

        var intersect = ((y1 > currY) != (y2 > currY))
            && (currX < (x2 - x1) * (currY - y1) / (y2 - y1) + x1);
        if (intersect) inside = !inside;
    }
    return inside;
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(lineP));
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(lineC));

    if (lineP.length != 0) {
        for (var i = 0; i < lineP.length / 2 - 1; i++) {
            gl.drawArrays(gl.LINES, 2 * i, 2);
        }
    }
    var m = 0;
    for (var j = 0; j < arrSQP.length; j++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrSQP[j]));
        gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrSQC[j]));
        if (arrSQP[j].length != 0) {
            gl.drawArrays(gl.TRIANGLES, m, 4);
            gl.drawArrays(gl.TRIANGLES, m + 1, 4);
            m = m + 4;
        }
    }

    for (var j = 0; j < arrrectP.length; j++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrrectP[j]));
        gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrrectC[j]));
        if (arrrectP[j].length != 0) {
            gl.drawArrays(gl.TRIANGLES, m, 4);
            gl.drawArrays(gl.TRIANGLES, m + 1, 4);
            m = m + 4;
        }
    }

    for (var j = 0; j < arrpolyP.length; j++) {
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrpolyP[j]));

        gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(arrpolyC[j]));
        if (arrpolyP[j].length != 0) {
            for (
                var i = 0;
                i < arrpolyP[j].length / arrNumpoly[j] - 1;
                i++
            ) {
                gl.drawArrays(
                    gl.LINE_LOOP,
                    arrNumpoly[j] * i,
                    arrNumpoly[j]
                );
            }
            numpolyDone++;
        }
    }
}