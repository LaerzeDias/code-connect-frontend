import { TagManager } from "./tags.js";
import { enviarComentario, carregarListaTagsDisponiveis } from "../api/api.js";
import { validarDados } from "../utils/validarForm.js";
import { exibirModal } from "./modal.js";

const tagsDisponiveis = await carregarListaTagsDisponiveis(); // tags disponíveis carregadas da API
const urlBase = "http://localhost:8080"
const tagManager = new TagManager(tagsDisponiveis);
let modalAtual;
let projetoAtual;

export function exibirModalProjeto(dadosProjeto) {

    projetoAtual = dadosProjeto;
    modalAtual = criarModal(dadosProjeto);
    document.body.appendChild(modalAtual);

    document.body.style.overflow = 'hidden';
    modalAtual.classList.remove("saida-suave");
    modalAtual.classList.add("fade-in-modal");

    const fecharBtns = modalAtual.querySelectorAll(".fechar__btn");
    fecharBtns.forEach(btn => {
        btn.addEventListener('click', () => fecharModalProjeto());
    });

    modalAtual.addEventListener('cancel', (event) => {
        event.preventDefault(); 
        fecharModalProjeto();
    });

    const comentarioFormulario = modalAtual.querySelector(".comentarios__formulario");
    const listaComentarios = modalAtual.querySelector(".comentarios__lista");
    comentarioFormulario.addEventListener("submit", async (event) => {
        const novoComentario = await publicarComentario({
            event: event, 
            projetoId: dadosProjeto.id, 
        });
        if (novoComentario) {
            const elementoFilho = criarComentario(novoComentario);
            incluirComentario(elementoFilho, listaComentarios); 
        }
    });
    
    modalAtual.showModal();
}

function fecharModalProjeto() {
    if (modalAtual.classList.contains("saida-suave")) return;

    modalAtual.classList.add("saida-suave");

    const encerrar = () => {
        modalAtual.close();
        modalAtual.remove();
        modalAtual.classList.remove("saida-suave");
        modalAtual.classList.remove("fade-in-modal");
        document.body.style.overflow = 'auto';
    };

    modalAtual.addEventListener('animationend', encerrar, { once: true });
}

async function publicarComentario({event, projetoId, comentarioPaiId=null}) {

    const mensagensErro = {"comentario": "\n• O comentário não pode ser vazio."};

    event.preventDefault();
    const formulario = event.target;
    const btnSubmit = formulario.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    try {
        validarDados(formulario, mensagensErro);

        const formData = new FormData();

        formData.append("usuarioId", 1); // usuário Admin somente pra teste

        // campos do formulário
        formData.append("projetoId", Number(projetoId));
        formData.append("comentarioPaiId", comentarioPaiId); // Diferente de null caso o comentário seja uma resposta a outro comentário
        formData.append("conteudo", formulario.querySelector(".comentarios__input").value);

        exibirModal({
            tipo: "loading",
            titulo: "Publicando comentário",
            mensagem: "Aguarde enquanto tentamos publicar seu comentário..."
        });    

        return await enviarComentario(formData, () => formulario.reset());
    } catch (erro) {
        exibirModal({
            tipo: "aviso",
            titulo: erro.message,
            mensagem: erro.cause,
        })
    } finally {
        btnSubmit.disabled = false;
    }
}

function incluirComentario(comentarioFilho, listaComentarios) {
    projetoAtual.numComentarios ++;
    listaComentarios.appendChild(comentarioFilho);
    comentarioFilho.scrollIntoView({ behavior: 'smooth', block: 'center' });
    modalAtual.querySelector(".projeto-metricas").innerHTML = 
    `
    ${gerarMetricasProjeto(projetoAtual.numContribuicoes, "code", "contrib.", "Contribuições ao código")}
    ${gerarMetricasProjeto(projetoAtual.numCompartilhamentos, "share", "compartilhamentos.", "Número de compartilhamentos")}
    ${gerarMetricasProjeto(projetoAtual.numComentarios, "comentarios", "comentários.", "Número de comentários")}
    `;
}

function criarComentario(comentario) {    
    const novoComentario = document.createElement("li");
    novoComentario.className = "comentario";
    novoComentario.setAttribute("data-id", comentario.id);
    novoComentario.innerHTML = 
    `
    <div class="comentario__conteudo">
        <span class="autor comentario__autor text-hint-parent">
            <img src="./assets/usuario.svg" alt="Foto de perfil do usuário">
            @${comentario.usuario.nome.toLowerCase()}
            <span class="text-hint">Acessar o perfil</span>
        </span>
        <p class="comentario__texto"></p>
    </div>
    <button class="responder__btn" type="button">Responder</button>
    ${gerarComentarioInput({placeholder: `Responda algo sobre o comentário de @${comentario.usuario.nome.toLowerCase()}`, hidden: true})}    
    `

    // conteúdo do comentário
    novoComentario.querySelector(".comentario__texto").textContent = comentario.conteudo;

    // botão ver respostas
    const btnVerRespostas = document.createElement("button");
    btnVerRespostas.className = "ver-respostas__btn";
    novoComentario.appendChild(btnVerRespostas);

    // comentários do comentário
    const listaFilhos = document.createElement("ul");
    listaFilhos.className = "comentarios__lista comentarios-filhos__lista hidden";
    novoComentario.appendChild(listaFilhos);

    // resposta ao comentário
    const responderBtn = novoComentario.querySelector(".responder__btn");
    const respostaForm = novoComentario.querySelector(".comentarios__formulario");
    responderBtn.addEventListener("click", () => {
        respostaForm.classList.toggle("hidden");
        respostaForm.classList.toggle("fade-in");
        responderBtn.textContent = "Responder";
        if (!respostaForm.classList.contains("hidden")) responderBtn.textContent = "Ocultar campo";
    });
    respostaForm.addEventListener("submit", async (event) => {
        const novoComentarioFilho = await publicarComentario({
            event: event, 
            projetoId: comentario.projetoId, 
            comentarioPaiId: comentario.id
        });
        if (novoComentarioFilho) {
            comentario.comentarios.push(novoComentario);
            responderBtn.click();
            mostrarComentariosFilhos(true);
            const elementoFilho = criarComentario(novoComentarioFilho);
            incluirComentario(elementoFilho, listaFilhos);
        }
    });

    // comentários filhos do comentário
    if (comentario.comentarios && comentario.comentarios.length > 0) {
        
        comentario.comentarios.forEach(filho => {
            listaFilhos.appendChild(criarComentario(filho));
        });

        mostrarComentariosFilhos();
    }

    function mostrarComentariosFilhos(verRespostas=false) {

        btnVerRespostas.innerHTML = `<div></div> Ver respostas (${comentario.comentarios.length})`;
        btnVerRespostas.onclick = () => {
            btnVerRespostas.innerHTML = `<div></div> Ocultar respostas (${comentario.comentarios.length})`;
            listaFilhos.classList.toggle("fade-in");
            listaFilhos.classList.toggle("hidden");
        };

        if (verRespostas && listaFilhos.classList.contains("hidden")) btnVerRespostas.click();
    }

    // delimitador
    const delimitador = document.createElement("div");
    delimitador.className = "comentario-delimitador";
    if (comentario.comentarioPaiId === null) novoComentario.appendChild(delimitador);

    return novoComentario;
}

function criarModal(projeto) {
    const projetoModal = document.createElement("dialog");
    projetoModal.id = "modal-projeto-detalhes";
    projetoModal.className = "modal__projeto";

    // data do projeto
    const dataCriacaoProjeto = new Date(projeto.dataCriacao);
    const dataCriacaoProjetoExibicao = dataCriacaoProjeto.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // tags do projeto
    let tagsSection = null;
    if (projeto.tags.length > 0) {
        tagsSection = document.createElement("section");
        tagsSection.className = "projeto__tags conteiner";
        tagsSection.innerHTML = 
        `<h2 class="tags__titulo titulo">Tags:</h2>
        <ul class="tags__lista"></ul>`
        const listaTags =  tagsSection.querySelector(".tags__lista");
        projeto.tags.map(tag => {
            if (tagManager.tagValida(tag, listaTags)) listaTags.appendChild(tagManager.criarTag(tag, false));
        });
    }

    // comentários do projeto
    const comentariosSection = document.createElement("section");
    comentariosSection.className = "comentarios";
    comentariosSection.innerHTML = 
    `
    ${gerarComentarioInput({placeholder: `Diga algo sobre o projeto de @${projeto.nomeUsuario.toLowerCase()}`})}
    <h2 class="comentarios__titulo titulo">Comentários</h2>
    <ul class="comentarios__lista"></ul>
    `;
    
    const projetoComentarios = comentariosSection.querySelector(".comentarios__lista");
    if (projeto.comentarios.length > 0) {
        projeto.comentarios.forEach(comentario => {
            const novoComentario = criarComentario(comentario);
            projetoComentarios.appendChild(novoComentario);
        }); 
    }

    projetoModal.innerHTML = 
    `
    <div class="modal__cabecalho">
        <h1 class="modal__titulo">${projeto.titulo} <span>― ${dataCriacaoProjetoExibicao}</span></h1>
        <button class="fechar__btn fechar-x__btn text-hint-parent" type="button" id="fechar-x-btn"
            aria-label="Fechar">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="default"
                xmlns="http://www.w3.org/2000/svg">
                <path fill="default"
                    d="M8.73047 0.878906L5.24414 4.36523L8.73047 7.85156L7.85156 8.73047L4.36523 5.24414L0.878906 8.73047L0 7.85156L3.48633 4.36523L0 0.878906L0.878906 0L4.36523 3.48633L7.85156 0L8.73047 0.878906Z"
                    />
            </svg>
            <span class="text-hint">Fechar aba</span>
        </button>
    </div>
    <div class="projeto modal__projeto-card">
        <div class="projeto-imagem__conteiner">
            <img class="projeto-imagem"
                src="${urlBase}${projeto.imagemUrl}">
        </div>
        <div class="projeto-conteudo">
            <div class="projeto-detalhes">
                <h3 class="projeto-titulo">${projeto.titulo}</h3>
                <p class="projeto-descricao">${projeto.descricao}</p>
            </div>
            <div class="projeto-icones">
                <ul class="projeto-metricas">
                    ${gerarMetricasProjeto(projeto.numContribuicoes, "code", "contrib.", "Contribuições ao código")}
                    ${gerarMetricasProjeto(projeto.numCompartilhamentos, "share", "compartilhamentos.", "Número de compartilhamentos")}
                    ${gerarMetricasProjeto(projeto.numComentarios, "comentarios", "comentários.", "Número de comentários")}
                </ul>
                <span class="autor projeto__autor text-hint-parent">
                    <img src="./assets/usuario.svg" alt="Foto de perfil do usuário">
                    @${projeto.nomeUsuario.toLowerCase()}
                    <span class="text-hint">Acessar o perfil</span>
                </span>
            </div>
        </div>
    </div>
    <section class="projeto__codigo conteiner">
        <h2 class="codigo__titulo titulo">Código:</h2>
        <textarea class="codigo__conteudo" name="codigo" id="projeto-codigo"></textarea>
    </section>
    <button class="fechar__btn" type="button" id="fechar-btn">Fechar</button>
    `
    
    const sectionCodigo = projetoModal.querySelector(".projeto__codigo");
    const fecharBtn = projetoModal.querySelector("#fechar-btn");
    if (tagsSection) projetoModal.insertBefore(tagsSection, sectionCodigo);
    projetoModal.insertBefore(comentariosSection, fecharBtn);    

    return projetoModal;
}

function gerarComentarioInput({placeholder, hidden=false, minlength=1}) {
    return `
    <form class="comentarios__formulario${hidden ? " hidden" : ""}" novalidate>
        <textarea class="comentarios__input" 
            name="comentario" 
            required minlength="${minlength}"
            placeholder="${placeholder}"
            ></textarea>
        <button class="publicar__btn" type="submit" id="submit-btn">
            <span>Publicar</span>
            <svg class="icon-svg" width="11" height="13" viewBox="0 0 11 13" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path stroke="currentColor"
                    d="M0 7.52344L5.23828 2.25L10.4766 7.52344H7.48828V12.0234H2.98828V7.52344H0ZM0 0H10.4766V1.51172H0V0Z"
                    fill="currentColor" />
            </svg>
        </button>
    </form>
    `
}

function gerarMetricasProjeto(valorMetrica, svgNome, textHint, textAlt) {
    return `
    <li class="metricas-item text-hint-parent">
        <img src="./assets/icons/${svgNome}.svg" alt="${textAlt}">
        <span>${valorMetrica}</span>
        <span class="text-hint">${valorMetrica} ${textHint}</span>
    </li>
    `
}