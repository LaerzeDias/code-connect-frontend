import { TagManager } from "../components/tags.js";
import { carregarListaTagsDisponiveis, carregarProjetos } from "../api/api.js";

const tagsDisponiveis = await carregarListaTagsDisponiveis(); // tags disponíveis carregadas da API

// botões de filtros
const filtros = document.querySelector(".feed__filtros-lista");

// dados paginação do feed
let paginaAtual = 0;
let listaCarregando = false;
let ultimaPagina = false;

// lista de projetos
const contagemProjetos = document.querySelector(".feed__contagem-resultado");
const listaProjetos = document.querySelector(".projetos-lista");
exibirSkeletonCards();
await buscarProjetosPaginados({}); // projetos carregados da API

// tags da barra de pesquisa do feed
const tagsPesquisa = new TagManager({
    input: document.getElementById("feed__tags-input"),
    listaTags: document.getElementById("feed__tags-lista"),
    sugestoesArray: tagsDisponiveis,
    sugestoesLista: document.getElementById("feed__tags-sugestao"),
    wrapper: document.getElementById("feed__tags-wrapper"),
    aceitaSomenteTags: false,
    onEnter: (dados) => buscarProjetosPaginados({
        inputText: dados.inputText,
        listaTags: dados.listaTags,
        resetar: true
    }),
    resetBtn: document.getElementById("tags__reset-btn")
});

// -----------------------------------------------------------------------------

// lógicas do feed
filtros.addEventListener("click", (event) => {

    const elementoClicado = event.target;

    if (elementoClicado.closest(".filtro-btn")) {
        const dadosInput = recuperarDadosInputTag();
        const [campo, direcao] =  event.target.value.split(",");
        
        buscarProjetosPaginados({
            ordernarPor: campo,
            orientacao: direcao,
            resetar: true,
            inputText: dadosInput.inputText,
            tags: dadosInput.tags
        });
    }   
})

function renderizarFeed(listaFiltradaProjetos) {
    listaProjetos.innerHTML = "";

    listaFiltradaProjetos.forEach((projeto, index) => {
        const novoProjeto = criarElementoProjeto(projeto);
        novoProjeto.classList.add("fade-in-card");
        novoProjeto.style.animationDelay = `${index * 200}ms`;
        novoProjeto.addEventListener("animationend", () => {
            novoProjeto.classList.remove("fade-in-card");
        }, { once: true });
        listaProjetos.appendChild(novoProjeto);
    })
}

async function buscarProjetosPaginados({pagina=0, maxItens=6, inputText=null, listaTags=null, ordernarPor="dataCriacao", orientacao="desc", resetar=false}) {

    if (listaCarregando || (ultimaPagina && !resetar)) return;
    
    listaCarregando = true;    

    // filtros da paginação
    const params = new URLSearchParams({
        page: pagina,
        size: maxItens,
        sort: `${ordernarPor},${orientacao}`
    });   
    inputText ? params.append("inputText", inputText) : null;
    listaTags ? params.append("listaTags", listaTags) : null;
    const filtros = `?${params}`;
    
    // requisição à API
    const projetosPaginados = await carregarProjetos(filtros);
    renderizarFeed(projetosPaginados.content);

    // página atual
    const infoPagina = projetosPaginados.page;        
    ultimaPagina = (infoPagina.number + 1) >= infoPagina.totalPages;
    paginaAtual = infoPagina.number + 1;
    contagemProjetos.textContent = `Resultados encontrados: ${infoPagina.totalElements}`;

    listaCarregando = false;
}

function recuperarDadosInputTag() {
    return {
        inputText: tagsPesquisa.input.value,
        tags: tagsPesquisa.getListaDeTags().map(tag => tag.textContent).join(",")
    }
}

function criarElementoProjeto(projeto) {
    const novoProjeto = document.createElement("li");
    novoProjeto.className = "projetos-item";
    novoProjeto.setAttribute("data-id", projeto.id);

    // descrição do projeto encurtada
    const descricaoReduzida = delimitarDescricao(projeto.descricao)

    // data do projeto tratada
    const dataCriacaoProjeto = new Date(projeto.dataCriacao);
    const dataCriacaoProjetoExibicao = dataCriacaoProjeto.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    novoProjeto.innerHTML = 
    `<div class="projeto-imagem__conteiner">
        <img class="projeto-imagem" src="http://localhost:8080${projeto.imagemUrl}">
    </div>
    <div class="projeto-conteudo">
        <div class="projeto-detalhes">
            <h3 class="projeto-titulo">${projeto.titulo}</h3>
            <p class="projeto-descricao">${descricaoReduzida}</p>
        </div>
        <div class="projeto-icones">
            <ul class="projeto-metricas">
                <li class="metricas-item text-hint-parent">
                    <img src="./assets/icons/code.svg" alt="Contribuições ao código">
                    <span>${projeto.numContribuicoes}</span>
                    <span class="text-hint">${projeto.numContribuicoes} contribuições</span>
                </li>
                <li class="metricas-item text-hint-parent">
                    <img src="./assets/icons/share.svg" alt="Número de compartilhamentos">
                    <span>${projeto.numCompartilhamentos}</span>
                    <span class="text-hint">${projeto.numCompartilhamentos} compartilhamentos</span>
                </li>
                <li class="metricas-item text-hint-parent">
                    <img src="./assets/icons/comentarios.svg" alt="Número de comentários">
                    <span>${projeto.numComentarios}</span>
                    <span class="text-hint">${projeto.numComentarios} comentários</span>
                </li>
            </ul>
            <span class="projeto-autor text-hint-parent">
                <img src="./assets/usuario.svg" alt="Foto de perfil do usuário">
                @${projeto.nomeUsuario.toLowerCase()}
                <span class="text-hint">Acessar o perfil</span>
            </span>
        </div>
    </div>`
    
    return novoProjeto;
}

function delimitarDescricao(descricao, limite = 170) {
    if (!descricao || descricao.length <= limite) return descricao;

    let reduzida = descricao.substring(0, limite);

    reduzida = reduzida.substring(0, Math.min(reduzida.length, reduzida.lastIndexOf(" ")));

    return `${reduzida.trim()}...`;
}

function exibirSkeletonCards() {
    for (let i = 0; i < 3; i++) {
        const novoSkeletonCard = criarSkeletonCard();
        listaProjetos.appendChild(novoSkeletonCard);
    }
}

function criarSkeletonCard() {
    const novoSkeletonCard = document.createElement("li");
    novoSkeletonCard.innerHTML = 
    `
    <div class="skeleton-imagem__conteiner">
        <div class="skeleton-imagem"></div>
    </div>
    <div class="skeleton-conteudo">
        <div class="skeleton-detalhes">
            <div class="skeleton-titulo"></div>
            <div class="skeleton-texto"></div>
        </div>
        <div class="skeleton-icones">
            <div class="skeleton-metricas">
                <div class="skeleton-metricas-item"></div>
                <div class="skeleton-metricas-item"></div>
                <div class="skeleton-metricas-item"></div>
            </div>
            <div class="skeleton-autor">
                <div class="skeleton-autor-foto"></div>
                <div class="skeleton-autor-nome"></div>
            </div>
        </div>
    </div>
    `
    novoSkeletonCard.className = "skeleton-card";
    return novoSkeletonCard;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};