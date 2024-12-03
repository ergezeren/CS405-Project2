/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
    constructor() {
        // Initialize shaders
        this.prog = InitShaderProgram(meshVS, meshFS);

        // Get uniform and attribute locations
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.colorLoc = gl.getUniformLocation(this.prog, 'color');
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

        // Create buffers
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.normalbuffer = gl.createBuffer();

        this.numTriangles = 0;

        // Initialize default lighting values
        this.lightingEnabled = false;
        this.ambient = 0.5; // Default ambient intensity
        this.shininess = 32.0; // Default shininess exponent
    }

    setMesh(vertPos, texCoords, normalCoords) {
        // Bind vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Bind texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Bind normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;
    }

    draw(trans) {
        gl.useProgram(this.prog);

        // Set transformation matrix
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        // Bind and enable position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        // Bind and enable texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        // Bind and enable normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        // Update light position based on arrow keys
        updateLightPos();

        // Set lighting uniforms
        gl.uniform1i(this.enableLightingLoc, this.lightingEnabled);
        gl.uniform1f(this.ambientLoc, this.ambient);
        gl.uniform1f(this.shininessLoc, this.shininess);
        gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0); // Light position

        // Draw the mesh
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the texture image data
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img);

        // Set texture parameters
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const sampler = gl.getUniformLocation(this.prog, 'tex');
        gl.uniform1i(sampler, 0);
    }
    
    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexLoc, show);
    }

    enableLighting(show) {
        this.lightingEnabled = show;
        gl.useProgram(this.prog);
        gl.uniform1i(this.enableLightingLoc, this.lightingEnabled);
    }

    setAmbientLight(ambient) {
        this.ambient = ambient;
        gl.useProgram(this.prog);
        gl.uniform1f(this.ambientLoc, this.ambient);
    }

    setSpecularLight(shininess) {
        this.shininess = shininess;
        gl.useProgram(this.prog);
        gl.uniform1f(this.shininessLoc, this.shininess);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
    }
    return dst;
}

const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp; 

    varying vec2 v_texCoord; 
    varying vec3 v_normal; 
    varying vec4 v_viewPosition;

    void main()
    {
        v_texCoord = texCoord;
        v_normal = normal;

        v_viewPosition = vec4(pos, 1.0);

        gl_Position = mvp * vec4(pos,1);
    }`;

// Updated Fragment Shader
const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform vec3 color; 
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float shininess;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec4 v_viewPosition;

    void main()
    {
        if(showTex && enableLighting){
            // UPDATE THIS PART TO HANDLE LIGHTING
            vec3 fragPos = vec3(v_viewPosition);
            vec3 lightDir = normalize(lightPos - fragPos);

            // diffuse light calculations
            float diffuse = dot(lightDir, normalize(v_normal)); 
            //

            // specular light calculations
            vec3 viewDir = normalize(-fragPos);
            vec3 reflection = reflect(-lightDir, v_normal);
            float specular = pow(max(dot(viewDir, reflection), 0.2), shininess);  
            //

            gl_FragColor = (ambient + diffuse + specular) * texture2D(tex, v_texCoord);
        }
        else if(showTex){
            gl_FragColor = texture2D(tex, v_texCoord);
        }
        else{
            gl_FragColor =  vec4(1.0, 0, 0, 1.0);
        }
    }`;


// Light direction parameters for Task 2
var lightX = 1.0;
var lightY = 1.0;

const keys = {};
function updateLightPos() {
    const translationSpeed = 0.1;
    if (keys['ArrowUp']) lightY += translationSpeed;
    if (keys['ArrowDown']) lightY -= translationSpeed;
    if (keys['ArrowRight']) lightX += translationSpeed;
    if (keys['ArrowLeft']) lightX -= translationSpeed;
}

// Event handlers for key presses
window.onkeydown = function (event) {
    keys[event.key] = true;
    DrawScene();
};
window.onkeyup = function (event) {
    keys[event.key] = false;
    DrawScene();
};

// Functions to handle sliders
function SetAmbientLight(param) {
    meshDrawer.setAmbientLight(param.value / 100);
    DrawScene();
}

function SetSpecularLight(param) {
    meshDrawer.setSpecularLight(param.value);
    DrawScene();
}