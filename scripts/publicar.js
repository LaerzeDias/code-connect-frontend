import { exibirModal } from "./modal.js";

// Área de seleção de imagem
const carregarImagemBtn = document.getElementById("upload-btn");
const carregarImagemInput = document.getElementById("upload-input");

// Formulário
const formulario = document.querySelector(".formulario");
const formularioImagem = document.querySelector(".formulario__imagem");

// Conteiner, label e imagem
const imagemConteiner = document.getElementById("projeto-img");
const imagem = imagemConteiner.querySelector(".imagem");
const imagemNome = document.getElementById("img-inserida");
let imgFile;

// Tags input e list
let idTags = 1;
let itemSelecionadoIdx = -1;
const tagInputWrapper = document.querySelector(".input-wrapper");
const tagInput = document.getElementById("tags-projeto");
const tagLista = document.getElementById("tags__lista-projeto");
const tagArraySugestao = ["Front-end", "Back-end", "Fullstack", "Python", "Java", "Javascript", "Typescript", 
    "C", "C#", "Data Science", "Mobile", "UX", "UI", "Design", "DevOps", "React", "Angular"];
const tagListaSugestao = document.getElementById("tags-sugestao");
tagArraySugestao.forEach(tag => {
    const novaTag = document.createElement("li");
    novaTag.classList.add("hidden", "sugestao-item");
    novaTag.setAttribute("tabindex", "-1");
    novaTag.id = tag.replace(/\s+/g, '-').toLowerCase() + "__tag";
    novaTag.textContent = tag;
    tagListaSugestao.appendChild(novaTag);
})

// Botões reset e submit 
const resetBtn = document.getElementById("reset-btn");

carregarImagemBtn.addEventListener("click", () => carregarImagemInput.click())

carregarImagemBtn.addEventListener("dragover", (event) => {
    event.preventDefault();

    carregarImagemBtn.classList.add("area-imagem--foco");
})

carregarImagemBtn.addEventListener("dragleave", () => {
    carregarImagemBtn.classList.remove("area-imagem--foco");
})

carregarImagemBtn.addEventListener("drop", (event) => {
    event.preventDefault();
    carregarImagemBtn.classList.remove("area-imagem--foco");

    imgFile = event.dataTransfer.files[0];
    
    processarImagem(imgFile);
});

carregarImagemInput.addEventListener("change", async (event) => {

    imgFile = event.target.files[0];
    
    processarImagem(imgFile);
})

formularioImagem.addEventListener("click", (event) => {

    const elementoClicado = event.target;
    
    if (elementoClicado.closest(".remover-wrapper")) {
        removerImagem();
    }     
})

tagLista.addEventListener("click", (event) => {

    const elementoClicado = event.target;

    if (elementoClicado.closest(".remover-wrapper")) {
        const tagParaRemover = elementoClicado.closest(".tags__item");
        tagLista.removeChild(tagParaRemover);
    }
})

tagInput.addEventListener("keydown", (event) => {
    
    const tagDigitada = tagInput.value.trim();
    const sugestoesVisiveis = document.querySelectorAll("#tags-sugestao li:not(.hidden)");

    if (event.key === "Enter") {

        event.preventDefault();

        if (itemSelecionadoIdx != -1) {
            selecionarSugestao(sugestoesVisiveis[itemSelecionadoIdx].textContent);
            return;
        }

        if (!(tagDigitada === "")) {
            
            const tagExistente = tagArraySugestao.find(tag => tag.toLowerCase() === tagDigitada.toLowerCase());
            if (!tagExistente) {
                exibirModal(
                    {
                        tipo: "confirmacao",
                        titulo: "Confirmar inserção de tag",
                        mensagem: "A tag digitada não corresponde a nenhuma tag cadastrada.\nDeseja continuar assim mesmo?",
                        textoBtnPrincipal: "Sim",
                        callback: () => incluirTag(tagDigitada)
                    } 
                );
            } else {
                incluirTag(tagExistente);
            }            

            limparCampo(tagInput);
        }
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        itemSelecionadoIdx = (itemSelecionadoIdx + 1) % sugestoesVisiveis.length;
        atualizarDestaque(sugestoesVisiveis);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        itemSelecionadoIdx = (itemSelecionadoIdx - 1 + sugestoesVisiveis.length) % sugestoesVisiveis.length;
        atualizarDestaque(sugestoesVisiveis);
    } else if (event.key == "Tab" && sugestoesVisiveis.length > 0) {

        event.preventDefault();

        if (itemSelecionadoIdx != -1) {
            selecionarSugestao(sugestoesVisiveis[itemSelecionadoIdx].textContent);
        } else {
            selecionarSugestao(sugestoesVisiveis[0].textContent);
        }
    }
 })

tagInput.addEventListener("input", () => {

    const tagDigitada = tagInput.value.toLowerCase().trim();

    recolherLista();

    if (tagDigitada === "") {
        return;
    }
    
    tagInput.classList.add("sem-bordas");

    const tagsFiltradas = tagArraySugestao
        .filter(tag => tag.toLowerCase().includes(tagDigitada))
        .slice(0, 5);  
    
    filtrarSugestao(tagsFiltradas);

    if (tagsFiltradas.length > 0) {
        tagListaSugestao.classList.remove("hidden");
    } else {
        recolherLista();
    } 
})

tagInputWrapper.addEventListener("focusout", (event) => {

    const elementoComFoco = event.relatedTarget;   

    if (!tagInputWrapper.contains(elementoComFoco)) {
        recolherLista();
    }
})

tagListaSugestao.addEventListener("click", (event) => {

    const elementoClicado = event.target;

    if (elementoClicado.closest(".sugestao-item")) {

        const tagSelecionada = elementoClicado.closest(".sugestao-item");
        selecionarSugestao(tagSelecionada.textContent);

        tagInput.focus();
    }
})

resetBtn.addEventListener("click", (event) => {

    event.preventDefault();

    const campos = [...formulario.elements];
    
    exibirModal({
        tipo: "confirmacao",
        titulo: "Descartar dados do projeto",
        mensagem: "Deseja realmente descartar os dados preenchidos?\nEsse processo não poderá ser revertido.",
        textoBtnPrincipal: "Sim",
        callback: () => limparCampos(campos)
    })
});

formulario.addEventListener("input", (event) => {
    event.target.classList.remove("campo-erro");
})

formulario.addEventListener("submit", (event) => {

    event.preventDefault();
    const campos = [...formulario.elements];
    campos.forEach(campo => campo.classList.remove("campo-erro"));

    const mensagensErro = {
        "nome": "\n• O nome precisa ter no mínimo 5 caracteres.",
        "descricao": "\n• A descrição do projeto precisa ter no mínimo 50 caracteres.",
        "imagem": "\n• O projeto precisa ter uma imagem definida."
    }

    const dadosValidos = validarDados(campos, mensagensErro);
    
    if (dadosValidos) {
        exibirModal(
            {
                tipo: "confirmacao",
                titulo: "Publicar novo projeto",
                mensagem: "Deseja realmente realizar a publicação de seu projeto?\nVocê poderá editá-lo mesmo após a postagem.",
                textoBtnPrincipal: "Sim",
                callback: null
            }
        )
    }
})

function validarDados(campos, mensagensErro) {
    
    if (!formulario.checkValidity()) {

        let mensagem = "Há campos inválidos que precisam ser revisados:\n";

        campos.find(campo => !campo.validity.valid).focus();

        campos.forEach(campo => {

            if (!campo.validity.valid) {
                campo.classList.add("campo-erro");
                mensagem += mensagensErro[campo.name];
            }
        })

        if (!imgFile) {
            mensagem += mensagensErro["imagem"];
        }

        exibirModal({
            tipo: "erro",
            titulo: "Campos inválidos",
            mensagem: mensagem,
        })

        return false;
    } else {
        return true;
    }
}

function limparCampos(campos) {

    campos.forEach(campo => {
        campo.value = "";
    })

    tagLista.innerHTML = "";
    removerImagem();
}

async function processarImagem(imgFile) {

    if (imgFile) {

        const arquivoValido = validarArquivo(imgFile);

        if (arquivoValido) {
            try {
                const imgObj = await lerArquivo(imgFile);
                alterarImagem(imgObj);
            } catch (error) {
                console.log(error);
            }
        }
    }

    carregarImagemInput.value = "";
}

function validarArquivo(arquivo) {

    // Verifica se a imagem é realmente um jpg ou png
    const listaTiposValidos = ["image/jpg", "image/jpeg", "image/png"];
    if (!listaTiposValidos.includes(arquivo.type)) {
        exibirModal({
            tipo: "erro",
            titulo: "Arquivo inválido",
            mensagem: "O arquivo inserido é inválido.\nPor favor, selecione somente imagens do tipo PNG ou JPG.",
        })
        return false;
    }

    // Verifica se a imagem é maior que 2MB
    if (arquivo.size > 2 * 1024 * 1024) {
        exibirModal({
            tipo: "erro",
            titulo: "Tamanho de imagem inválido",
            mensagem: "O tamanho da imagem inserida é muito grande.\nPor favor, selecione somente imagens de tamanho menor ou igual a 2MB.",
        })
        return false;
        }

    return true;
}

function lerArquivo(arquivo) {

    return new Promise((resolve, reject) => {
        const leitor = new FileReader();

        leitor.onload = () => {
            resolve({url: leitor.result, nome: arquivo.name});
        }

        leitor.onerror = () => {
            reject(`Houve uma falha durante a leitura do arquivo ${arquivo.name}`);
        }
        
        leitor.readAsDataURL(arquivo);
    }) 
}

function alterarImagem(img) {

    // Imagem
    imagem.src = img.url;
    imagemConteiner.classList.remove("hidden");
    carregarImagemBtn.classList.remove("entrada-suave");
    carregarImagemBtn.classList.add("hidden");

    // Nome da imagem
    imagemNome.querySelector("span").textContent = img.nome;
    imagemNome.classList.remove("hidden");
}

function removerImagem() {
    
    imagem.src = "";
    imgFile = null;
    imagemNome.classList.add("hidden");
    imagemConteiner.classList.add("hidden");
    carregarImagemBtn.classList.add("entrada-suave");
    carregarImagemBtn.classList.remove("hidden");
}

function incluirTag(tagDigitada) {
    
    const novaTag = document.createElement("li");
    novaTag.className = "tags__item";
    novaTag.innerHTML = 
    `
    <span class="tag--inserida" id="tag__${idTags}">
        <span class="tag-nome"></span>
        <div class="remover-wrapper">
            <svg class="icon-svg remover-icon" width="9" height="9" viewBox="0 0 9 9" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor"
                    d="M8.73047 0.878906L5.24414 4.36523L8.73047 7.85156L7.85156 8.73047L4.36523 5.24414L0.878906 8.73047L0 7.85156L3.48633 4.36523L0 0.878906L0.878906 0L4.36523 3.48633L7.85156 0L8.73047 0.878906Z"
                    fill="currentColor" />
            </svg>
            <span class="text-hint tag-hint">Remover tag</span>
        </div>
    </span>
    `;
    const novaTagNome = novaTag.querySelector(".tag-nome");
    novaTagNome.textContent = tagDigitada;
    tagLista.appendChild(novaTag);
    idTags++;
}

function recolherLista() {

    if (!tagListaSugestao.classList.contains("hidden")) {
        tagListaSugestao.classList.add("hidden");
    }
    
    tagArraySugestao.forEach(tag => {
        const tagId = tag.replace(/\s+/g, '-').toLowerCase() + "__tag";
        document.getElementById(tagId).classList.add("hidden");
        document.getElementById(tagId).classList.remove("item--em-foco");
    });

    tagInput.classList.remove("sem-bordas");

    itemSelecionadoIdx = -1;
}

function filtrarSugestao(lista) {
    
    lista.forEach(tag => {
        const tagId = tag.replace(/\s+/g, '-').toLowerCase() + "__tag";
        document.getElementById(tagId).classList.remove("hidden");      
    });
}

function selecionarSugestao(tagSelecionada) {
    tagInput.value = tagSelecionada;
    recolherLista();
}

function atualizarDestaque(lista) {
    lista.forEach((item, idx) => {
        item.classList.toggle("item--em-foco", idx === itemSelecionadoIdx);
    });
}

const limparCampo = (campo) => campo ? campo.value = "" : null;