import { initHeaderTags } from "./header.js";
import { exibirModal } from "../components/modal.js";
import { TagManager } from "../components/tags.js";
import { ImageUploadManager } from "../components/imageUpload.js";
import { enviarProjeto, carregarListaTagsDisponiveis } from "../api/api.js";

// formulário
const formulario = document.querySelector(".formulario");

// imagem do formulário
const imagemFormulario = new ImageUploadManager({
    imagemConteiner: document.getElementById("projeto-img"),
    imagem: document.querySelector(".imagem"),
    imagemNome: document.getElementById("img-inserida"),
    carregarImagemBtn: document.getElementById("upload-btn"),
    carregarImagemInput: document.getElementById("upload-input"),
    wrapper: document.querySelector(".formulario__imagem")
});

const tagsDisponiveis = await carregarListaTagsDisponiveis(); // tags disponíveis carregadas da API

// tags da barra de pesquisa
const tagsPesquisa = initHeaderTags(avisarRedirecionamentoPagina, tagsDisponiveis)

// tags do formulário
const tagsFormulario = new TagManager({
    input: document.getElementById("formulario__tags-input"),
    listaTags: document.getElementById("formulario__tags-lista"),
    sugestoesArray: tagsDisponiveis,
    sugestoesLista: document.getElementById("formulario__tags-sugestao"),
    wrapper: document.getElementById("formulario__tags-wrapper")
});

// botões reset e submit 
const resetBtn = document.getElementById("reset-btn");

// ---------------------------------------------------------------------------------

// lógicas do formulário
formulario.addEventListener("input", (event) => {
    event.target.classList.remove("campo-erro");
})

formulario.addEventListener("submit", (event) => {

    event.preventDefault();
    const campos = pegarDadosFormulario();
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
                deveFechar: false,
                callback: () => publicarProjeto(campos)
            }
        )
    }
})

resetBtn.addEventListener("click", (event) => {

    event.preventDefault();
    
    if (dadosNaoSalvos()) {
        const campos = pegarDadosFormulario();
        exibirModal({
            tipo: "confirmacao",
            titulo: "Descartar dados do projeto",
            mensagem: "Deseja realmente descartar os dados preenchidos?\nEsse processo não poderá ser revertido.",
            textoBtnPrincipal: "Sim",
            callback: () => limparCamposFormulario(campos)
        })
    }
});

async function publicarProjeto(campos) {

    exibirModal({
        tipo: "loading",
        titulo: "Publicando projeto",
        mensagem: "Aguarde enquanto tentamos publicar seu projeto..."
    });

    const formData = new FormData();
    formData.append("usuarioId", 1); // usuário Admin somente pra teste

    // campos do formulário
    formData.append("titulo", campos.find(campo => campo.id === "nome-projeto").value);
    formData.append("descricao", campos.find(campo => campo.id === "descricao-projeto").value);

    // tags
    const tags = tagsFormulario.getListaDeTags().map(tag => tag.textContent);
    tags.forEach(tag => formData.append("tags", tag));

    // imagem
    formData.append("imagem", imagemFormulario.imgFile);

    await enviarProjeto({dadosProjeto: formData, callback: () => limparCamposFormulario(campos)});
}

function validarDados(campos, mensagensErro) {
    
    if (!formulario.checkValidity() || !imagemFormulario.imgFile) {

        let mensagem = "Há campos inválidos que precisam ser revisados:\n";

        const primeiroCampoErro = campos.find(campo => !campo.validity.valid);
        primeiroCampoErro ? primeiroCampoErro.focus() : null;

        campos.forEach(campo => {

            if (["nome-projeto", "descricao-projeto"].includes(campo.id) && !campo.validity.valid) {
                campo.classList.add("campo-erro");
                mensagem += mensagensErro[campo.name];
            }
        })

        if (!imagemFormulario.imgFile) {
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

function limparCamposFormulario(campos) {

    campos.forEach(campo => {
        limparCampo(campo);
    })

    tagsFormulario.limparInput();
    tagsFormulario.limparLista();
    imagemFormulario.removerImagem();
}

function avisarRedirecionamentoPagina(dados) {
    if (dadosNaoSalvos()) {
        exibirModal({
            tipo: "aviso",
            titulo: "Aviso de redirecionamento",
            mensagem: "Há dados informados que não foram salvos.\nDeseja realmente ir para o feed e continuar a busca?",
            exibirBtnSecundario: true,
            textoBtnPrincipal: "Sim",
            callback: () => irParaOFeed(dados)
        })
        return;
    }    
    irParaOFeed(dados);
}

function irParaOFeed(dados) {
    const termos = dados.listaTags.join(',');
    const busca = dados.inputText;
    window.location.href = `feed.html?tags=${termos}&busca=${busca}`;
}

function dadosNaoSalvos() {
    const temCamposPreenchidos = pegarDadosFormulario().some(campo => campo.value.trim() !== "");
    const temImagem = !!imagemFormulario.imgFile;
    const temTags = tagsFormulario.getListaDeTags().length > 0;

    return temCamposPreenchidos || temImagem || temTags;
}

const pegarDadosFormulario = () => [...formulario.elements].filter(el => ["INPUT", "TEXTAREA"].includes(el.tagName));

const limparCampo = (campo) => campo ? campo.value = "" : null;