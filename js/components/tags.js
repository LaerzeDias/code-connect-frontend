import { exibirModal } from "./modal.js";

export class TagManager {

    constructor({input, listaTags, sugestoesArray, sugestoesLista, wrapper, aceitaSomenteTags=true, onEnter=null, resetBtn=null}) {
        
        // properties básicas da TagManager
        this.input = input;
        this.listaTags = listaTags;                 // lista <ul> contendo os elementos tags
        this.sugestoesArray = sugestoesArray;       // array contendo as tags em string
        this.sugestoesLista = sugestoesLista;       // lista <ul> contendo as tags sugeridas
        this.wrapper = wrapper;                     // conteiner do campo em si
        this.aceitaSomenteTags = aceitaSomenteTags; // boolean para limitar o campo a somente entrada de tags
        this.onEnter = onEnter;                     // função callback
        this.resetBtn = resetBtn; 
        this.itemSelecionado = -1;

        // setups
        this.setupSugestoes();
        this.setupListeners();
    }

    setupSugestoes() {
        this.sugestoesArray.forEach((tag, id) => {
            const novaTag = document.createElement("li");
            novaTag.classList.add("hidden", "sugestao-item");
            novaTag.setAttribute("tabindex", "-1");
            novaTag.setAttribute("data-id", id);
            novaTag.textContent = tag;     
            this.sugestoesLista.appendChild(novaTag);
        });
    }

    // retorna um array com cada item da lista <ul>
    getListaDeTags() {
        return [...this.listaTags.querySelectorAll(".tag-nome")];
    }

    // verifica se a tag digita realmente existe
    tagExistente(tagDigitada) {
        return this.sugestoesArray.find(
            tagExistente => tagExistente.toLowerCase() === tagDigitada.toLowerCase()
        );
    }

    // verifica se a tag selecionada já foi inserida na lista
    tagJaInserida(tagSelecionada) {
        return this.getListaDeTags().find(
            tagExistente => tagExistente.textContent.toLowerCase() === tagSelecionada.toLowerCase()
        );
    }

    // Realiza todas as validações na tag
    tagValida(tagSelecionada) {
        if (!this.tagExistente(tagSelecionada)) {
            exibirModal({
                tipo: "aviso",
                titulo: "Tag inválida",
                mensagem: "A tag informada não corresponde a nenhuma tag disponível.\nEscolha outra tag e tente novamente.",
            });
            return false;
        } else if (this.tagJaInserida(tagSelecionada)) {
            exibirModal({
                tipo: "aviso",
                titulo: "Tag já inserida",
                mensagem: `A tag '${tagSelecionada}' já foi inserida.\nPor favor, verifique a listagem de tags inseridas e tente novamente.`
            });
            return false;
        } 
        
        return true;
    }

    // cria novo item <li> da tag
    criarTag(tagDigitada) {
        const tagNome = this.tagExistente(tagDigitada);
        const novaTag = document.createElement("li");
        novaTag.className = "tags__item";
        novaTag.innerHTML = 
        `
        <span class="tag--inserida">
            <span class="tag-nome"></span>
            <div class="remover-wrapper text-hint-parent">
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
        novaTagNome.textContent = tagNome;

        return novaTag;
    }

    // inclui uma nova tag na listagem
    incluirTag(novaTag) {
        this.listaTags.appendChild(novaTag);
        this.recolherLista();
        this.limparInput();
    }

    // filtra as sugestões conforme input do usuário e retorna a lista de tags
    filtrarSugestao(tagDigitada) {
        const tagsFiltradas = this.sugestoesArray
            .map((tag, id) => ({id: id, nome: tag}))
            .filter(tag => tag.nome.toLowerCase().includes(tagDigitada))
            .slice(0, 5);
        tagsFiltradas.forEach(tag => this.sugestoesLista.querySelector(`[data-id="${tag.id}"]`).classList.remove("hidden"));

        return tagsFiltradas;                
    }

    // seleciona a sugestão 
    selecionarSugestao(tagSelecionada) {
        this.input.value = tagSelecionada;
        this.recolherLista();
    }

    // recolhe a lista de sugestões
    recolherLista() {
        if (!this.sugestoesLista.classList.contains("hidden")) {
            this.sugestoesLista.classList.add("hidden");
        }
        
        this.sugestoesLista.querySelectorAll(".sugestao-item").forEach(
            tagSugestao => {
                tagSugestao.classList.add("hidden");
                tagSugestao.classList.remove("item--em-foco");
            } 
        );

        this.input.classList.remove("sem-bordas");
        this.itemSelecionado = -1;
    }
    
    // destaca o item atualmente selecionado da lista de sugestão
    atualizarDestaque(listaSuspensa) {
        listaSuspensa.forEach((item, idx) => {
            item.classList.toggle("item--em-foco", idx === this.itemSelecionado);
        });
    }

    // dispara o evento ao pressionar o enter
    dispararEvento(tagSelecionada=null, callback=null) {
        if (this.onEnter) {
            this.onEnter({
                inputText: tagSelecionada ? tagSelecionada : this.input.value,
                listaTags: this.getListaDeTags().map(tag => tag.textContent)
            });
        }
        if (callback) callback;
    }

    // limpa o input de tags
    limparInput() {
        this.input.value = "";
    }

    // limpa a lista de tags
    limparLista() {
        this.listaTags.innerHTML = "";
    }

    // listeners de eventos
    setupListeners() {
        this.input.addEventListener("keydown", (event) => {    
            const textoDigitado = this.input.value.trim();
            const sugestoesVisiveis = this.sugestoesLista.querySelectorAll("li:not(.hidden)");  

            if (event.key === "Enter") {

                event.preventDefault();
                
                let tagSelecionada;
                if (this.itemSelecionado != -1) {
                    tagSelecionada = sugestoesVisiveis[this.itemSelecionado] ? sugestoesVisiveis[this.itemSelecionado].textContent : null;
                } else {
                    tagSelecionada = textoDigitado != "" ? textoDigitado : null;
                }
 
                if (!tagSelecionada && this.aceitaSomenteTags) {
                    return;
                }

                if (!this.aceitaSomenteTags && this.itemSelecionado != -1 || this.aceitaSomenteTags) {
                    if (this.tagValida(tagSelecionada)) {
                        const novaTag = this.criarTag(tagSelecionada);
                        this.incluirTag(novaTag);
                        return;
                    }
                }

                this.dispararEvento(tagSelecionada, this.recolherLista);
                
            } else if (event.key === "ArrowDown") {

                event.preventDefault();
                this.itemSelecionado = (this.itemSelecionado + 1) % sugestoesVisiveis.length;
                this.atualizarDestaque(sugestoesVisiveis);

            } else if (event.key === "ArrowUp") {

                event.preventDefault();
                this.itemSelecionado = (this.itemSelecionado - 1 + sugestoesVisiveis.length) % sugestoesVisiveis.length;
                this.atualizarDestaque(sugestoesVisiveis);

            } else if (event.key == "Tab" && sugestoesVisiveis.length > 0) {

                event.preventDefault();

                if (this.itemSelecionado != -1) {
                    this.selecionarSugestao(sugestoesVisiveis[this.itemSelecionado].textContent);
                } else {
                    this.selecionarSugestao(sugestoesVisiveis[0].textContent);
                }
            }
        });

        let timer;
        this.input.addEventListener("input", () => {

            clearTimeout(timer);

            timer = setTimeout(() => {
                this.dispararEvento();
            }, 300);

            const tagDigitada = this.input.value.toLowerCase().trim();

            this.recolherLista();

            if (tagDigitada === "") {
                return;
            }

            this.input.classList.add("sem-bordas");
            
            const tagsFiltradas = this.filtrarSugestao(tagDigitada);

            if (tagsFiltradas.length > 0) {
                this.sugestoesLista.classList.remove("hidden");
            } else {
                this.recolherLista();
            }
        });

        this.sugestoesLista.addEventListener("click", (event) => {
        
            const elementoClicado = event.target;
        
            if (elementoClicado.closest(".sugestao-item")) {
        
                const tagSelecionada = elementoClicado.closest(".sugestao-item");
                const tagSelecionadaNome = tagSelecionada.textContent;
                if (this.tagValida(tagSelecionadaNome)) {
                    const novaTag = this.criarTag(tagSelecionadaNome);
                    this.incluirTag(novaTag);
                    this.dispararEvento();
                }
        
                this.input.focus();
            }
        });

        this.listaTags.addEventListener("click", (event) => {

            const elementoClicado = event.target;

            if (elementoClicado.closest(".remover-wrapper")) {
                const tagParaRemover = elementoClicado.closest(".tags__item");
                this.listaTags.removeChild(tagParaRemover);
                this.dispararEvento();
            }
        });

        this.wrapper.addEventListener("focusout", (event) => {

            const elementoComFoco = event.relatedTarget;   

            if (!this.wrapper.contains(elementoComFoco)) {
                this.recolherLista();
            }
        });

        if (this.resetBtn) {            
            this.resetBtn.addEventListener("click", () => {
                this.limparLista();
            });
        }
    }
};