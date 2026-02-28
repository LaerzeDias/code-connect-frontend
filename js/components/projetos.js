import { exibirModalProjeto } from "./projetoModal.js"
import { carregarProjetos, buscarProjeto } from "../api/api.js";
const sleep = (timeOut) => new Promise(resolve => setTimeout(resolve, timeOut)); // timeout para simular a espera pela API

export class ProjetoManager {

    constructor({filtros, filtrosOnClick=null, listaProjetos, maxItens, carregarMais, contagemProjetos}) {

        // properties básicas do ProjetoManager
        this.filtros = filtros;
        this.filtrosOnClick = filtrosOnClick;
        this.listaProjetos = listaProjetos;
        this.contagemProjetos = contagemProjetos;
        this.maxItens = maxItens;
        this.carregarMais = carregarMais;
        this.listaCarregando = false;
        this.ultimaPagina = false;
        this.pagina = 0;
        
        // observer para o infinite loading
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.listaCarregando && !this.ultimaPagina) {
                this.buscarProjetos({});
            }
        }, { threshold: 1.0 });
        this.observer.observe(this.carregarMais);

        // setup
        this.setupListeners();
    }

    renderizarCards(listaFiltradaProjetos) {

        const cardsFantasma = this.listaProjetos.querySelectorAll(":scope > .skeleton-card");
        if(cardsFantasma) cardsFantasma.forEach(cardFantasma => cardFantasma.remove());

        const fragmento = document.createDocumentFragment();

        listaFiltradaProjetos.forEach((projeto, index) => {
            const novoProjeto = this.criarProjeto(projeto);
            this.animarCard(novoProjeto, index, "fade-in-card");
            fragmento.appendChild(novoProjeto);
        });

        this.listaProjetos.appendChild(fragmento);
    }

    async buscarProjetos({inputText=null, inputTags=null, resetarFiltros=false, resetar=false}) {

        if (this.listaCarregando || (this.ultimaPagina && !resetar)) return;

        this.listaCarregando = true;

        let [campo, direcao] = this.filtros.querySelector(".filtro--ativo").value.split(",");

        if (resetarFiltros) {
            this.selecionarFiltro(this.filtros.querySelector("#recentes-btn"));
            [campo, direcao] = ["dataCriacao", "desc"];
        }

        if (resetar) {
            this.pagina = 0
            this.listaProjetos.innerHTML = "";
        };

        this.exibirSkeletonCards();

        // filtros da paginação
        const params = new URLSearchParams({
            page: this.pagina,
            size: this.maxItens,
            sort: `${campo},${direcao}`
        });   
        inputText ? params.append("inputText", inputText) : null;
        inputTags ? params.append("inputTags", inputTags) : null;
        const filtrosConsulta = `?${params}`;
        
        // requisição à API
        const projetosPaginados = await carregarProjetos(filtrosConsulta);
        const projetos = projetosPaginados.content;
        await sleep(2000);
        this.renderizarCards(projetos);

        // página atual
            const infoPagina = projetosPaginados.page;        
            this.ultimaPagina = (infoPagina.number + 1) >= infoPagina.totalPages;
            this.contagemProjetos.textContent = `Resultados encontrados: ${infoPagina.totalElements}`;

        if (!this.ultimaPagina) this.pagina ++;

        this.listaCarregando = false;
    }

    selecionarFiltro(filtroSelecionado) {    
        this.filtros.querySelectorAll(".filtro-btn").forEach(filtro => filtro.classList.remove("filtro--ativo"));
        filtroSelecionado.classList.add("filtro--ativo");
    }

    criarProjeto(projeto) {
        const novoProjeto = document.createElement("li");
        novoProjeto.className = "projeto";
        novoProjeto.setAttribute("data-id", projeto.id);

        // descrição do projeto encurtada
        const descricaoReduzida = this.delimitarDescricao(projeto.descricao)

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
                <span class="autor projeto__autor text-hint-parent">
                    <img src="./assets/usuario.svg" alt="Foto de perfil do usuário">
                    @${projeto.nomeUsuario.toLowerCase()}
                    <span class="text-hint">Acessar o perfil</span>
                </span>
            </div>
        </div>`
        
        return novoProjeto;
    }

    exibirSkeletonCards() {
        this.contagemProjetos.textContent = `Buscando projetos...`;
        for (let i = 0; i < 3; i++) {
            const novoSkeletonCard = this.criarSkeletonCard();
            this.animarCard(novoSkeletonCard, i, "fade-in-card");
            this.listaProjetos.appendChild(novoSkeletonCard);
        }
    }

    criarSkeletonCard() {
        const novoSkeletonCard = document.createElement("li");
        novoSkeletonCard.className = "skeleton-card";
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

    delimitarDescricao(descricao, limite = 170) {
        if (!descricao || descricao.length <= limite) return descricao;

        let reduzida = descricao.substring(0, limite);

        reduzida = reduzida.substring(0, Math.min(reduzida.length, reduzida.lastIndexOf(" ")));

        return `${reduzida.trim()}...`;
    }

    animarCard(card, index, anim) {
        card.classList.add(anim);
        card.style.animationDelay = `${index * 100}ms`;
        card.addEventListener("animationend", () => {
            card.classList.remove(anim);
        }, { once: true });
    }

    setupListeners() {
        this.listaProjetos.addEventListener("click", async (event) => {

            const elementoClicado = event.target;
            const projetoSelecionado = elementoClicado.closest(".projeto");  

            if (projetoSelecionado) {
                const projetoId = projetoSelecionado.dataset.id;
                const projeto = await buscarProjeto(projetoId);
                if (projeto) exibirModalProjeto(projeto);
            }
        });
        
        this.filtros.addEventListener("click", (event) => {

            const elementoClicado = event.target;
            const filtroSelecionado = elementoClicado.closest(".filtro-btn");

            if (filtroSelecionado && !filtroSelecionado.classList.contains("filtro--ativo")) {
                this.selecionarFiltro(filtroSelecionado);
                const dadosInput = this.filtrosOnClick ? this.filtrosOnClick() : null;
                
                this.buscarProjetos({
                    inputText: dadosInput ? dadosInput.inputText : null,
                    inputTags: dadosInput ? dadosInput.inputTags : null,
                    resetar: true
                });
            }   
        });
    }
}

