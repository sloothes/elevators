//  ShaderMaterial.js

function StandardMaterial( texture ){ 
    return new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        map: texture, 
        shading: THREE.SmoothShading,
        side: THREE.DoubleSide 
    }); 
};

function normalPixel() { 
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPkqf//HwAEtAKL6CdQMgAAAABJRU5ErkJggg==" 
};

function imgBase64( data ){
    return  "data:image/png;base64," + data;
}

function ShaderMaterial(normal, matcap){
    var material = new THREE.ShaderMaterial( {
        uniforms: { 
            tNormal: { type: "t", value: normal },
            tMatCap: { type: "t", value: matcap },
            time: { type: "f", value: 0 },
            bump: { type: "f", value: 0 },
            noise: { type: "f", value: 0.04 },
            repeat: { type: "v2", value: new THREE.Vector2( 1, 1 ) },
            useNormal: { type: "f", value: 0 },
            useRim: { type: "f", value: 0 },
            rimPower: { type: "f", value: 0 },
            useScreen: { type: "f", value: 0 },
            normalScale: { type: "f", value: 1 },
            normalRepeat: { type: "f", value: 1 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        shading: THREE.SmoothShading,
        side: THREE.DoubleSide
    });

    material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;
    material.uniforms.tNormal.value.wrapS = material.uniforms.tNormal.value.wrapT = THREE.RepeatWrapping;

    material.uniforms.tMatCap.value.needsUpdate = true;

    return material;

}
