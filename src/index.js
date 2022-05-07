import 'babel-polyfill'
import { initializeApp } from "firebase/app"
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore/lite'

const firebaseConfig = {
  apiKey: "AIzaSyBYt1cgKBWxwO3Op-s8R2ScIdNVM-cUlDE",
  authDomain: "bitcoin-lisboa-maps.firebaseapp.com",
  projectId: "bitcoin-lisboa-maps",
  storageBucket: "bitcoin-lisboa-maps.appspot.com",
  messagingSenderId: "264054856758",
  appId: "1:264054856758:web:aab408e68be420d1e34c97"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const getUserProvidedLocations = async () => {
    const locationsCol = collection(db, 'locations')
    const q = query(locationsCol, where("approved", "==", true))
    const locationSnapshot = await getDocs(q)
    const locationList = locationSnapshot.docs.map(doc => {
        const data = doc.data()

        return {
            username: null,
            acceptsLightning: data.acceptsLightning,
            acceptsOnChain: data.acceptsOnChain,
            acceptsLiquid: data.acceptsLiquid,
            mapInfo: {
                title: data.name,
                website: data.website,
                phone: data.phone,
                instagram: data.instagram,
                twitter: data.twitter,
                whatsapp: data.whatsapp,
                pluscode: data.pluscode,
                coordinates: {
                    latitude: data.latLong._lat,
                    longitude: data.latLong._long,
                }
            }
        }
    })
 
    addMapPins(locationList)
}

const getBitcoinJungleLocations = () => {
    // TODO :: Un-comment this if they ever get a Galoy instance!!
    // const body = JSON.stringify({
    //     "query": "query businessMapMarkers { businessMapMarkers { username mapInfo { title coordinates { longitude latitude } } } }",
    //     "variables": {},
    //     "operationName": "businessMapMarkers"
    // })

    // fetch(
    //     "https://api.mainnet.bitcoinjungle.app/graphql", 
    //     {
    //         method: "POST",
    //         headers: {
    //             "content-type": "application/json",
    //         },
    //         body: body,
    //     }
    // )
    // .then((res) => res.json())
    // .then((obj) => {
    //     const pins = obj.data.businessMapMarkers.map((pin) => {
    //         return {
    //             username: pin.username,
    //             acceptsLightning: true,
    //             acceptsOnChain: true,
    //             acceptsLiquid: false,
    //             mapInfo: pin.mapInfo,
    //         } 
    //     })

    //     addMapPins(pins)
    // })
}

const addMapPins = (pins) => {
    const markerAnnotations = pins.map((el) => {

        const calloutDelegate = {
            calloutContentForAnnotation: function() {
                var element = document.createElement("div");
                element.className = "review-callout-content";
                var title = element.appendChild(document.createElement("h1"));
                title.textContent = el.mapInfo.title;

                var p1 = element.appendChild(document.createElement("p"))

                if(el.mapInfo.whatsapp) {
                    p1.textContent = "WhatsApp: " + el.mapInfo.whatsapp
                }

                
                if(el.acceptsOnChain) {
                    var img = element.appendChild(document.createElement("img"));
                    img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/onchain.png"
                    img.width = 20
                    img.style.display = "inline"
                }

                if(el.acceptsLightning) {
                    var img = element.appendChild(document.createElement("img"));
                    img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/lightning.png"
                    img.width = 20
                    img.style.display = "inline"
                }

                if(el.acceptsLiquid) {
                    var img = element.appendChild(document.createElement("img"));
                    img.src = "https://storage.googleapis.com/bitcoin-jungle-maps-images/liquid.png"
                    img.width = 20
                    img.style.display = "inline"
                }

                return element;
            },
            calloutRightAccessoryForAnnotation: function() {
                if(el.username) {
                    const accessoryViewRight = document.createElement("a");
                    accessoryViewRight.className = "right-accessory-view";
                    accessoryViewRight.href = "https://pay.bitcoinjungle.app/" + el.username;
                    accessoryViewRight.target = "_blank";
                    accessoryViewRight.appendChild(document.createTextNode("➡"));

                    return accessoryViewRight;
                } else {
                    const accessoryViewRight = document.createElement("a");
                    accessoryViewRight.className = "right-accessory-view";
                    accessoryViewRight.href = "#";

                    return accessoryViewRight;
                }
            }
        }


        const coordinate = new mapkit.Coordinate(el.mapInfo.coordinates.latitude, el.mapInfo.coordinates.longitude)

        let annotationObj = {
            title: el.mapInfo.title,
            website: el.mapInfo.website,
            callout: calloutDelegate,
            titleVisibility: mapkit.FeatureVisibility.Hidden,
        }

        if(!el.username) {
            annotationObj.color = "purple"
        }

        return new mapkit.MarkerAnnotation(coordinate, annotationObj)
    })

    map.addAnnotations(markerAnnotations)
}

mapkit.init({
    authorizationCallback: function (done) {
        fetch("/api/token")
        .then((res) => res.text())
        .then(done)
        .then(getBitcoinJungleLocations)
        .then(getUserProvidedLocations)
    },
    language: navigator.language || navigator.userLanguage,
})

const center = new mapkit.Coordinate(38.721377, -9.131023)
const map = new mapkit.Map("apple-maps", {
    center,
    cameraDistance: 50000,
    showsPointsOfInterest: false,
})

map.addEventListener('zoom-end', (evt) => {
    const map = mapkit.maps[0]
    const curentCameraDistance = map.cameraDistance.toFixed(0)

    if(curentCameraDistance < 10000) {
        map.annotations = map.annotations.map((el) => {
            el.titleVisibility = mapkit.FeatureVisibility.Visible

            return el
        })
    } else {
        map.annotations = map.annotations.map((el) => {
            el.titleVisibility = mapkit.FeatureVisibility.Hidden

            return el
        })
    }
})