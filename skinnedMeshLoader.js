//  skinnedMeshLoader.js (v6)

    (async function(){

    //  Disable outfit direction visible on startup.
        localPlayer.outfit.direction.visible = false;

        male = {};

        await db.collection("male")
        .find().forEach(
            function(doc){
                male[doc._id] = doc;
            }, 
            function(err){
                if (err) throw err;
            }
        ).catch(function(err){
            console.error(err);
        }).then(function(){
            return localPlayer.outfit.fromJSON(male);
        }).then(function(outfit){
            male = outfit;  // important!
            debugMode && console.log({"male":male});
        });


        female = {};

        await db.collection("female")
        .find().forEach(
            function(doc){
                female[doc._id] = doc;
            }, 
            function(err){
                if (err) throw err;
            }
        ).catch(function(err){
            console.error(err);
        }).then(function(){
            return localPlayer.outfit.fromJSON(female);
        }).then(function(outfit){
            female = outfit;  // important!
            debugMode && console.log({"female":female});
        });

    //  skeleton.

        await db.collection("skeleton")
        .findOne({_id:"body"}, 
        function(err){
            if (err) throw err;
        }).then(function(doc){
            return doc;
        }).catch(function(err){
            console.error(err);
        }).then(function(doc){
            return localPlayer.outfit.fromJSON({skeleton:doc});
        }).then(function(outfit){
            skeleton = outfit.skeleton;
            debugMode && console.log({"skeleton":skeleton});
        });

    //  Startup.

        localPlayer.outfit.removeAll(); // important.
        localPlayer.outfit.setGender("male");
        localPlayer.outfit.add(
            {body: male.body},
            {eyes: male.eyes},
            {hairs: male.hairs},
            {costume: male.costume},
            {shoes: male.shoes},
        );

    //  Enable outfit direction visible.
        localPlayer.outfit.direction.visible = true;

    })();
