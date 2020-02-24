////////////////////////////////////////////////////////////////////////////////
//	                             	Init
////////////////////////////////////////////////////////////////////////////////

import * as THREE from './three.js/three.module.js';
import { MTLLoader } from './three.js/MTLLoader.js';
import { OBJLoader } from './three.js/OBJLoader.js';

// init renderer
var renderer	= new THREE.WebGLRenderer({
	// antialias	: true,
	alpha: true
});
renderer.setClearColor(new THREE.Color('lightgrey'), 0);
// renderer.setPixelRatio( 1/2 );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.domElement.style.position = 'absolute'
renderer.domElement.style.top = '0px'
renderer.domElement.style.left = '0px'
document.body.appendChild( renderer.domElement );

// array of functions for the rendering loop
var onRenderFcts= [];

// init scene and camera
var scene	= new THREE.Scene();

////////////////////////////////////////////////////////////////////////////////
//	                    	Initialize a basic camera
////////////////////////////////////////////////////////////////////////////////

// Create a camera
var camera = new THREE.Camera();
scene.add(camera);

////////////////////////////////////////////////////////////////////////////////
//                        handle arToolkitSource
////////////////////////////////////////////////////////////////////////////////

var arToolkitSource = new THREEx.ArToolkitSource({
	sourceType : 'webcam',
})

arToolkitSource.init(function onReady(){
	onResize()
})

// handle resize
window.addEventListener('resize', function(){
	onResize()
})
function onResize(){
	arToolkitSource.onResizeElement()
	arToolkitSource.copyElementSizeTo(renderer.domElement)
	if( arToolkitContext.arController !== null ){
		arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
	}
}
////////////////////////////////////////////////////////////////////////////////
//                      initialize arToolkitContext
////////////////////////////////////////////////////////////////////////////////


// create atToolkitContext
var arToolkitContext = new THREEx.ArToolkitContext({
	cameraParametersUrl: './data/camera_para.dat',
	detectionMode: 'mono',
	maxDetectionRate: 30,
	canvasWidth: 80*3,
	canvasHeight: 60*3,
})
// initialize it
arToolkitContext.init(function onCompleted(){
	// copy projection matrix to camera
	camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
})

// update artoolkit on every frame
onRenderFcts.push(function(){
	if( arToolkitSource.ready === false )	return

	arToolkitContext.update( arToolkitSource.domElement )
})


////////////////////////////////////////////////////////////////////////////////
//                      Create a ArMarkerControls
////////////////////////////////////////////////////////////////////////////////

var markerRoot = new THREE.Group
scene.add(markerRoot)
var artoolkitMarker = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
	type : 'pattern',
	patternUrl : './data/patt.hiro'
	// patternUrl : THREEx.ArToolkitContext.baseURL + '../data/data/patt.kanji'
})

// build a smoothedControls
var smoothedRoot = new THREE.Group()
scene.add(smoothedRoot)
var smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
	lerpPosition: 0.4,
	lerpQuaternion: 0.3,
	lerpScale: 1,
})
onRenderFcts.push(function(delta){
	smoothedControls.update(markerRoot)
})
//////////////////////////////////////////////////////////////////////////////////
//	                    	add an object in the scene
//////////////////////////////////////////////////////////////////////////////////

var arWorldRoot = smoothedRoot



var onError = function () { };
var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		// console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
	}
};


var ambientLight = new THREE.AmbientLight( 0x9EADFF, .7 );
arWorldRoot.add( ambientLight );
var pointLight = new THREE.PointLight( 0xFFC5CB, .8 );
pointLight.position.copy( camera.position );
scene.add( pointLight );

new MTLLoader()
.setPath( './assets/' )
.load( 'flora1.mtl', function ( materials ) {
	materials.preload();
	new OBJLoader()
	.setMaterials(materials)
	.setPath( './assets/' )
	.load( 'flora1.obj', function ( object) {
		object.scale.x= .001;
		object.scale.y= .001;
		object.scale.z= .001;
		//
		object.position.x = 0;
		object.position.y	= 0;
		object.position.z = 0;

		object.rotation.x= -1;
		object.rotation.y= -1;

		arWorldRoot.add( object );

		// onRenderFcts.push(function(){
		// 	object.rotation.y += 0.01
		// })
	}, onProgress, onError );
} );


//////////////////////////////////////////////////////////////////////////////////
//	                 	render the whole thing on the page
//////////////////////////////////////////////////////////////////////////////////

// render the scene
onRenderFcts.push(function(){
	renderer.render( scene, camera );
})

// run the rendering loop
var lastTimeMsec= null
requestAnimationFrame(function animate(nowMsec){
	// keep looping
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
	lastTimeMsec	= nowMsec
	// call each update function
	onRenderFcts.forEach(function(onRenderFct){
		onRenderFct(deltaMsec/1000, nowMsec/1000)
	})
})
