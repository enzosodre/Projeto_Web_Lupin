document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('fotos').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('imagem-container').style.display = 'block';
        document.getElementById('imagem-container').innerHTML = `
            <img src="imagem1.jpg" alt="Imagem 1">
            <img src="imagem2.jpg" alt="Imagem 2">
            <img src="imagem3.jpg" alt="Imagem 3">
            <!-- Adicione quantas imagens desejar -->
        `;
    });
});


function changeSeason() {
    var selectedSeason = document.getElementById("temporada").value;
    if(selectedSeason !="Temporada"){
        window.location.href = selectedSeason;
    }
    else{
        alert("Selecione uma temporada válida!")
    }
}


function confirmarExclusaoUsuario(id) {
    if (confirm("Tem certeza de que deseja excluir este usuário?")) {
        window.location.href = '/excluir_usuario/' + id;
    }
}


const addressForm = document.querySelector("#address-form");
const cepInput = document.querySelector("#cep");
const addressInput = document.querySelector("#address");
const cityInput = document.querySelector("#city");
const neighborhoodInput = document.querySelector("#neighborhood");
const regionInput = document.querySelector("#region");
const formInputs = document.querySelectorAll("[data-input]");

const closeButton = document.querySelector("#close-message");

const fadeElement = document.querySelector("#fade");

// Validate CEP Input
cepInput.addEventListener("keypress", (e) => {
  const onlyNumbers = /[0-9]|\./;
  const key = String.fromCharCode(e.keyCode);

  console.log(key);

  console.log(onlyNumbers.test(key));

  // allow only numbers
  if (!onlyNumbers.test(key)) {
    e.preventDefault();
    return;
  }
});

//Get address event
cepInput.addEventListener("keyup", (e) => {
    const inputValue = e.target.value

    //Check if we have the correct length
    if(inputValue.length === 8){
        getAddress(inputValue);
    }
});

// Get customer address from API
const getAddress = async (cep) => {
    toggleLoader();

    cepInput.blur();

    const apiUrl = `https://viacep.com.br/ws/${cep}/json/`;

    const response = await fetch(apiUrl);

    const data = await response.json();

    console.log(data);
    console.log(formInputs);
    console.log(data.erro);

    //Show error and reset form
    if(data.erro){
        if(!addressInput.hasAttribute("disabled")){
            toggleDisabled();
        }

        addressForm.reset();
        toggleLoader();
        toggleMessage("Cep inválido, tente novamente.");
        return;
    }

    if(addressInput.value === ""){
        toggleDisabled();
    }

    addressInput.value = data.logradouro;
    cityInput.value = data.localidade;
    neighborhoodInput.value = data.bairro;
    regionInput.value = data.uf;

    toggleLoader();
};

// add or remove disabled attribute
const toggleDisabled = () => {
    if(regionInput.hasAttribute("disabled")){
        formInputs.forEach((input) => {
            input.removeAttribute("disabled");
        });
    } else {
        formInputs.forEach((input) => {
            input.setAttribute("disabled", "disabled");
        });
    }
};

// Show or hide loader
const toggleLoader = () => {
    const fadeElement = document.querySelector("#fade");
    const loaderElement = document.querySelector("#loader");

    loaderElement.classList.toggle("hide");
};

//Show or ride message
const toggleMessage = (msg) => {
    const messageElement = document.querySelector("#message");

    const messageElementText = document.querySelector("#message p");

    messageElementText.innerText = msg;

    fadeElement.classList.toggle("hide");
    messageElement.classList.toggle("hide");
}

//Close message modal
closeButton.addEventListener("click", () => toggleMessage());

//save address
addressForm.addEventListener("submit", (e) => {
    e.preventDefault();
    toggleLoader();
    setTimeout(() => {
        toggleLoader();
        toggleMessage("Endereço salvo com sucesso!\n Seu presente será enviado!");
        addressForm.reset();
        toggleDisabled();
    }, 1000);
});