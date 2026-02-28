import { initHeaderTags } from "./header.js";
import { exibirModal } from "../components/modal.js";
import { TagManager } from "../components/tags.js";
import { InputManager } from "../components/input.js";
import { ImageUploadManager } from "../components/imageUpload.js";
import { enviarProjeto, carregarListaTagsDisponiveis } from "../api/api.js";
import { validarDados, pegarDadosFormulario } from "../utils/validarForm.js";

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
initHeaderTags(avisarRedirecionamentoPagina, tagsDisponiveis);

// tags do formulário
const tagsFormulario = new InputManager({
    tagManager: new TagManager(tagsDisponiveis),
    input: document.getElementById("formulario__tags-input"),
    listaTags: document.getElementById("formulario__tags-lista"),
    sugestoesTags: document.getElementById("formulario__tags-sugestao"),
    wrapper: document.getElementById("formulario__tags-wrapper")
});

// botão reset
const resetBtn = document.getElementById("reset-btn");

// ---------------------------------------------------------------------------------

// lógicas do formulário
formulario.addEventListener("submit", (event) => {

    event.preventDefault();
    const campos = pegarDadosFormulario(formulario);
    campos.forEach(campo => campo.classList.remove("campo-erro"));

    const mensagensErro = {
        "nome": "\n• O nome precisa ter no mínimo 5 caracteres.",
        "descricao": "\n• A descrição do projeto precisa ter no mínimo 50 caracteres.",
        "imagem": "\n• O projeto precisa ter uma imagem definida."
    }

    try {
        validarDados(formulario, mensagensErro, true, imagemFormulario);
    
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
    } catch (erro) {
        exibirModal({
            tipo: "erro",
            titulo: erro.message,
            mensagem: erro.cause,
        })
    }
})

resetBtn.addEventListener("click", (event) => {

    event.preventDefault();
    
    if (dadosNaoSalvos()) {
        const campos = pegarDadosFormulario(formulario);
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
    const temCamposPreenchidos = pegarDadosFormulario(formulario).some(campo => campo.value.trim() !== "");
    const temImagem = !!imagemFormulario.imgFile;
    const temTags = tagsFormulario.getListaDeTags().length > 0;

    return temCamposPreenchidos || temImagem || temTags;
}

const limparCampo = (campo) => campo ? campo.value = "" : null;