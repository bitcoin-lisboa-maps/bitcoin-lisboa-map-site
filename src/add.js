import 'babel-polyfill'
import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, GeoPoint } from "firebase/firestore"; 

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

const form = document.getElementById('add-form')
const showMap = document.getElementById('show-map')
const appleMap = document.getElementById('apple-map')
const latitudeEl = document.getElementById('latitude')
const longitudeEl = document.getElementById('longitude')
const submitButtonEl = document.getElementById('submit-button')

let clickAnnotation, map


showMap.addEventListener('click', (e) => {
	showMap.style.display = "none"
	appleMap.style.display = "block"

	const center = new mapkit.Coordinate(38.721377, -9.131023)
	map = new mapkit.Map("apple-map", {
	    center,
	    cameraDistance: 50000,
	})

	map.element.addEventListener('click', (event) => {
		if(clickAnnotation) {
            map.removeAnnotation(clickAnnotation);
        }
    
        const coordinate = map.convertPointOnPageToCoordinate(new DOMPoint(event.pageX, event.pageY));
        clickAnnotation = new mapkit.MarkerAnnotation(coordinate, {
            title: "Adicione Negócio Aqui",
            color: "#c969e0"
        })
        map.addAnnotation(clickAnnotation)

        latitudeEl.value = coordinate.latitude
        longitudeEl.value = coordinate.longitude
	})
})

form.addEventListener('submit', async (e) => {
	e.preventDefault()

	submitButtonEl.style.display = "none"

	const formData = new FormData(form);
	let postData = {}

	postData.approved = false

	for(var pair of formData.entries()) {
		postData[pair[0]] = pair[1]
	}

	if(!postData.name) {
		alert("Por favor, digite um nome")
		return false
	}

	if(!parseFloat(postData.latitude)) {
		alert("Coordenadas de latitude inválidas")
		return false
	}

	if(!parseFloat(postData.longitude)) {
		alert("Coordenadas de longitude inválidas")
		return false
	}

	if(postData.acceptsOnChain == "on") {
		postData.acceptsOnChain = true
	} else {
		postData.acceptsOnChain = false
	}

	if(postData.acceptsLightning == "on") {
		postData.acceptsLightning = true
	} else {
		postData.acceptsLightning = false
	}

	if(postData.acceptsLiquid == "on") {
		postData.acceptsLiquid = true
	} else {
		postData.acceptsLiquid = false
	}

	try {
		postData.latLong = new GeoPoint(postData.latitude, postData.longitude)
	} catch(e) {
		alert(e)
		return false
	}

	delete postData.latitude
	delete postData.longitude

	if(!postData.acceptsOnChain && !postData.acceptsLightning && !postData.acceptsLiquid) {
		alert("Selecione pelo menos uma moeda aceita")
		return false
	}

	try {
		const docRef = await addDoc(collection(db, "locations"), postData)
		const sendEmail = await fetch("/api/notify")

		showMap.style.display = "block"
		appleMap.style.display = "none"

		if(map) {
			map.destroy()
		}
		
		clickAnnotation = null

		submitButtonEl.style.display = "block"

		form.reset()

		alert("Esta empresa foi adicionada com sucesso. Agora será analisado por um administrador. Uma vez aprovado, ele aparecerá no mapa")
	} catch(e) {
		alert(e)
		return false
	}
})

mapkit.init({
    authorizationCallback: function (done) {
        fetch("/api/token")
        .then((res) => res.text())
        .then(done)
    },
    language: navigator.language || navigator.userLanguage,
})